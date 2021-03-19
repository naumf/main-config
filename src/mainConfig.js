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

function checkEnvConfigFile(configPath) {
  const config = require(configPath)
  if (typeof config !== 'function') {
    throw new Error(`${configPath} does not export a function.`)
  }
}

function createEmitter(watch) {
  return watch ? new EventEmitter() : null
}

function setEnvPath(params) {
  params.env.path = params.env.path || path.join(process.cwd(), '.env')
  checkFileAccess(params.env.path)
}

function setConfigPath(defaultConfig, params) {
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
}

function setDefaultNotOverridableOnWatch(params) {
  if (!params.env.notOverridableOnWatch.includes('NODE_ENV')) {
    params.env.notOverridableOnWatch.push('NODE_ENV')
  }
}

function getReadonlyConfig(isReadonly, config) {
  return isReadonly ? readonly(config) : null
}

function emitChanges(emitter, changes) {
  if (changes && changes.length) {
    emitter.emit('*', changes)
    for (const change of changes) {
      emitter.emit(change.path, change.newValue, change.oldValue)
    }
  }
}

function mainConfig(params = {}) {
  const { validateEnvSchema, validateConfigSchema } = validateParamsSchema(
    params
  )
  const emitter = createEmitter(params.env.watch)
  const defaultConfig = {
    env: null,
    environments: {}
  }
  const selectedConfigs = {}
  const isOverridableOnWatch = []

  setEnvPath(params)
  setConfigPath(defaultConfig, params)
  setDefaultNotOverridableOnWatch(params)

  let [currentConfig] = buildConfig({
    params,
    defaultConfig,
    selectedConfigs,
    isOverridableOnWatch,
    currentConfig: null,
    validateEnvSchema,
    validateConfigSchema
  })

  let readonlyConfig = getReadonlyConfig(params.readonly, currentConfig)
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
        readonlyConfig = getReadonlyConfig(params.readonly, currentConfig)
        emitChanges(emitter, changes)
      } catch (e) {
        emitter.emit(kWatchError, e)
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

  function watchConfig(propertyPath, listener) {
    if (params.env.watch) {
      emitter.setMaxListeners(emitter.getMaxListeners() + 1)
      emitter.on(propertyPath, listener)
      return () => {
        emitter.off(propertyPath, listener)
        emitter.setMaxListeners(Math.max(emitter.getMaxListeners() - 1, 0))
      }
    }
    return () => null
  }

  function watchError(listener) {
    if (params.env.watch) {
      emitter.setMaxListeners(emitter.getMaxListeners() + 1)
      emitter.on(kWatchError, listener)
      return () => {
        emitter.off(kWatchError, listener)
        emitter.setMaxListeners(Math.max(emitter.getMaxListeners() - 1, 0))
      }
    }
    return () => null
  }

  return { config, watchConfig, watchError, unwatchFile }
}

module.exports = mainConfig
