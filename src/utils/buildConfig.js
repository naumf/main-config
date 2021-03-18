'use strict'

const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

const { createAjvErrors, createEnvSchemaErrors } = require('./schema')
const diffMerge = require('./diffMerge')

function buildConfig({
  params,
  defaultConfig,
  selectedConfigs,
  isOverridableOnWatch,
  currentConfig,
  validateEnvSchema,
  validateConfigSchema
}) {
  const isReload = !!(defaultConfig.env && params.env.watch)
  const envBuffer = fs.readFileSync(params.env.path, { encoding: 'utf8' })
  const parsed = dotenv.parse(envBuffer)
  const validEnvSchema = validateEnvSchema(parsed)
  if (!validEnvSchema) throw createEnvSchemaErrors(validateEnvSchema.errors)

  let changed = false
  const changes = []

  for (const key in parsed) {
    const isUndefined = typeof process.env[key] === 'undefined'
    const isOverridable = params.env.overridable.includes(key)
    const isNotOverridableOnWatch = params.env.notOverridableOnWatch.includes(
      key
    )
    if (
      !isReload &&
      process.env[key] !== String(parsed[key]) &&
      ((!isUndefined && isOverridable) || isUndefined)
    ) {
      process.env[key] = String(parsed[key])
      changed = true
      if (!isNotOverridableOnWatch && !isOverridableOnWatch.includes(key)) {
        isOverridableOnWatch.push(key)
      }
    } else if (
      isReload &&
      process.env[key] !== String(parsed[key]) &&
      ((!isUndefined &&
        isOverridableOnWatch.includes(key)) /* c8 ignore next */ ||
        isUndefined)
    ) {
      process.env[key] = String(parsed[key])
      changed = true
      /* c8 ignore next 3 */
      if (!isOverridableOnWatch.includes(key)) {
        isOverridableOnWatch.push(key)
      }
    }
  }

  /* c8 ignore next */
  if (!changed && currentConfig) return [currentConfig, changes]

  if (!params.environments.includes(process.env.NODE_ENV)) {
    throw new Error(
      `Invalid environment variable: NODE_ENV, should be equal to one of the allowed values: {"allowedValues":${JSON.stringify(
        params.environments
      )}}`
    )
  }

  if (!defaultConfig.env) defaultConfig.env = process.env.NODE_ENV

  if (!selectedConfigs.global) {
    selectedConfigs.global = require(path.join(params.path, 'global.js'))
  }

  if (!selectedConfigs.env) {
    selectedConfigs.env = require(path.join(
      params.path,
      `${defaultConfig.env}.js`
    ))
  }

  let config

  if (isReload) {
    config = Object.assign(
      diffMerge(
        selectedConfigs.global(),
        selectedConfigs.env(),
        currentConfig,
        function (path, newValue, oldValue) {
          changes.push({ path, newValue, oldValue })
        }
      ),
      defaultConfig
    )
  } else {
    config = Object.assign(
      diffMerge(selectedConfigs.global(), selectedConfigs.env()),
      defaultConfig
    )
  }

  const validConfigSchema = validateConfigSchema(config)
  if (!validConfigSchema) {
    throw createAjvErrors('Invalid config. ', validateConfigSchema.errors)
  }

  return [config, changes]
}

module.exports = buildConfig
