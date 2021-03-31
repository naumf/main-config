'use strict'

const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

const { createAjvErrors, createEnvSchemaErrors } = require('./schema')
const diffMerge = require('./diffMerge')
const hasOwnProp = require('./hasOwnProp')

function parseAndValidateEnv(envPath, validateEnvSchema) {
  const envBuffer = fs.readFileSync(envPath, { encoding: 'utf8' })
  const parsed = dotenv.parse(envBuffer)
  const validEnvSchema = validateEnvSchema(parsed)
  if (!validEnvSchema) {
    throw createEnvSchemaErrors(validateEnvSchema.errors)
  }
  return parsed
}

function isConfigReloaded(currentEnv, watch) {
  return !!(currentEnv && watch)
}

function isEnvSettableOnInit(
  parsed,
  key,
  isReload,
  isUndefined,
  isOverridable
) {
  return (
    !isReload &&
    process.env[key] !== String(parsed[key]) &&
    ((!isUndefined && isOverridable) || isUndefined)
  )
}

function isEnvSettableOnReload(
  parsed,
  key,
  isReload,
  isUndefined,
  isOverridableOnWatch
) {
  return (
    isReload &&
    process.env[key] !== String(parsed[key]) &&
    ((!isUndefined &&
      isOverridableOnWatch.includes(key)) /* c8 ignore next */ ||
      isUndefined)
  )
}

function validateMainConfigEnv(environments) {
  if (!environments.includes(process.env.MAIN_CONFIG_ENV)) {
    throw new Error(
      `Invalid environment variable: MAIN_CONFIG_ENV, should be equal to one of the allowed values: {"allowedValues":${JSON.stringify(
        environments
      )}}`
    )
  }
}

function assignSelectedConfigs(defaultConfig, selectedConfigs, params) {
  if (!defaultConfig.env) {
    defaultConfig.env = process.env.MAIN_CONFIG_ENV
  }
  if (!selectedConfigs.global) {
    selectedConfigs.global = require(path.join(params.path, 'global.js'))
  }
  if (!selectedConfigs.env) {
    selectedConfigs.env = require(path.join(
      params.path,
      `${defaultConfig.env}.js`
    ))
  }
  if (!process.env.NODE_ENV) {
    if (['staging', 'production'].includes(defaultConfig.env)) {
      process.env.NODE_ENV = 'production'
    } else if (defaultConfig.env === 'test') {
      process.env.NODE_ENV = 'test'
    } else {
      process.env.NODE_ENV = 'development'
    }
  }

  if (
    ['staging', 'production'].includes(defaultConfig.env) &&
    process.env.NODE_ENV !== 'production' &&
    !params.noWarnings
  ) {
    process.emitWarning('NODE_ENV is not set to production.', {
      code: 'INCORRECT_NODE_ENV',
      detail:
        'Set NODE_ENV="production" to improve performance on production and production-like environments.'
    })
  }
}

function mergeConfig(
  isReload,
  defaultConfig,
  selectedConfigs,
  currentConfig,
  changes
) {
  let config

  if (isReload) {
    config = Object.assign(
      diffMerge(
        selectedConfigs.global(),
        selectedConfigs.env(),
        currentConfig,
        function (propertyPath, newValue, oldValue) {
          changes.push({ path: propertyPath, newValue, oldValue })
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

  return config
}

function validateConfig(validateConfigSchema, config) {
  const validConfigSchema = validateConfigSchema(config)
  if (!validConfigSchema) {
    throw createAjvErrors('Invalid config:', validateConfigSchema.errors)
  }
}

function buildConfig({
  params,
  defaultConfig,
  selectedConfigs,
  isOverridableOnWatch,
  currentConfig,
  validateEnvSchema,
  validateConfigSchema
}) {
  const isReload = isConfigReloaded(defaultConfig.env, params.env.watch)
  const parsed = parseAndValidateEnv(params.env.path, validateEnvSchema)

  let changed = false
  const changes = []

  for (const key in parsed) {
    /* c8 ignore next 3 */
    if (!hasOwnProp(parsed, key)) {
      continue
    }
    const isUndefined = typeof process.env[key] === 'undefined'
    const isOverridable = params.env.overridable.includes(key)
    const isNotOverridableOnWatch = params.env.notOverridableOnWatch.includes(
      key
    )
    if (
      isEnvSettableOnInit(parsed, key, isReload, isUndefined, isOverridable)
    ) {
      process.env[key] = String(parsed[key])
      changed = true
      if (!isNotOverridableOnWatch && !isOverridableOnWatch.includes(key)) {
        isOverridableOnWatch.push(key)
      }
    } else if (
      isEnvSettableOnReload(
        parsed,
        key,
        isReload,
        isUndefined,
        isOverridableOnWatch
      )
    ) {
      process.env[key] = String(parsed[key])
      changed = true
      /* c8 ignore next 3 */
      if (!isOverridableOnWatch.includes(key)) {
        isOverridableOnWatch.push(key)
      }
    }
  }

  /* c8 ignore next 3 */
  if (!changed && currentConfig) {
    return [currentConfig, changes]
  }

  validateMainConfigEnv(params.environments)
  assignSelectedConfigs(defaultConfig, selectedConfigs, params)

  const config = mergeConfig(
    isReload,
    defaultConfig,
    selectedConfigs,
    currentConfig,
    changes
  )

  validateConfig(validateConfigSchema, config)

  return [config, changes]
}

module.exports = buildConfig
