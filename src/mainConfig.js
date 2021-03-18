'use strict'

const path = require('path')
const { EventEmitter } = require('events')
const {
  buildConfig,
  readonly,
  schema: { validateParamsSchema },
  file: { watchFile, checkFileAccess }
} = require('./utils')

const kWatchError = Symbol('WatchError')

function checkEnvConfigFile(path) {
  const config = require(path)
  if (typeof config !== 'function') {
    throw new Error(`${path} does not export a function.`)
  }
}

function mainConfig(params = {}) {
  let emitter
  const { validateEnvSchema, validateConfigSchema } = validateParamsSchema(
    params
  )
  if (params.env.watch) emitter = new EventEmitter()
  params.env.path = params.env.path || path.join(process.cwd(), '.env')
  checkFileAccess(params.env.path)

  const defaultConfig = {
    env: null,
    environments: {}
  }

  const selectedConfigs = {}

  const isOverridableOnWatch = []

  params.path =
    params.path ||
    path.dirname(
      module.parent && module.parent.parent && module.parent.parent.filename
    )

  checkEnvConfigFile(path.join(params.path, 'global.js'))
  for (const env of params.environments) {
    checkEnvConfigFile(path.join(params.path, `${env}.js`))
    defaultConfig.environments[env.toUpperCase()] = env
  }

  if (!params.env.notOverridableOnWatch.includes('NODE_ENV')) {
    params.env.notOverridableOnWatch.push('NODE_ENV')
  }

  let [currentConfig] = buildConfig({
    params,
    defaultConfig,
    selectedConfigs,
    isOverridableOnWatch,
    currentConfig: null,
    validateEnvSchema,
    validateConfigSchema
  })

  let readonlyConfig = params.readonly ? readonly(currentConfig) : null
  let unwatchFile = () => {
    params.env.watch = false
  }

  if (params.env.watch) {
    const watcher = watchFile(params.env.path, function (err) {
      /* c8 ignore next 4 */
      if (err) {
        emitter.emit(kWatchError, err)
        return
      }
      try {
        let changes = []
        ;[currentConfig, changes] = buildConfig({
          params,
          defaultConfig,
          selectedConfigs,
          isOverridableOnWatch,
          currentConfig,
          validateEnvSchema,
          validateConfigSchema
        })
        readonlyConfig = params.readonly ? readonly(currentConfig) : null

        if (changes && changes.length) {
          emitter.emit('*', changes)
          for (const change of changes) {
            emitter.emit(change.path, change.newValue, change.oldValue)
          }
        }
      } catch (err) {
        emitter.emit(kWatchError, err)
      }
    })

    unwatchFile = () => {
      params.env.watch = false
      watcher.close()
    }
  }

  function config() {
    return params.readonly ? readonlyConfig : currentConfig
  }

  function watchConfig(path, listener) {
    if (params.env.watch) {
      emitter.setMaxListeners(emitter.getMaxListeners() + 1)
      emitter.on(path, listener)
      return () => {
        emitter.off(path, listener)
        emitter.setMaxListeners(Math.max(emitter.getMaxListeners() - 1, 0))
      }
    } else {
      return () => {}
    }
  }

  function watchError(listener) {
    if (params.env.watch) {
      emitter.setMaxListeners(emitter.getMaxListeners() + 1)
      emitter.on(kWatchError, listener)
      return () => {
        emitter.off(kWatchError, listener)
        emitter.setMaxListeners(Math.max(emitter.getMaxListeners() - 1, 0))
      }
    } else {
      return () => {}
    }
  }

  return { config, watchConfig, watchError, unwatchFile }
}

module.exports = mainConfig
