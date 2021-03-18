'use strict'

const fs = require('fs')
const path = require('path')
const { suite } = require('uvu')
const assert = require('uvu/assert')
const mainConfig = require('../index')
const { hasOwnProp } = require('../src/utils')
const getTimeoutDelay = require('../tests_utils/getTimeoutDelay')

const configPath = path.join(__dirname, '../tests_data')
const envPath = path.join(configPath, '.env')
const watchEnvPath = path.join(configPath, '/watch/.env')
const timeoutDelay = getTimeoutDelay()

function changeWatchEnvValue(buffer, key, value) {
  fs.writeFileSync(
    watchEnvPath,
    buffer.toString().replace(new RegExp(`${key}=.*`), `${key}=${value}`)
  )
}

const testSuite = suite('mainConfig')

testSuite.after.each(() => {
  process.env.NODE_ENV = 'test'
  if (hasOwnProp(process.env, 'MC_VERSION')) delete process.env.MC_VERSION
  if (hasOwnProp(process.env, 'MC_DB_HOST')) delete process.env.MC_DB_HOST
  if (hasOwnProp(process.env, 'MC_DB_PORT')) delete process.env.MC_DB_PORT
  if (hasOwnProp(process.env, 'MC_DB_USERNAME'))
    delete process.env.MC_DB_USERNAME
  if (hasOwnProp(process.env, 'MC_TOKEN_SECRET'))
    delete process.env.MC_TOKEN_SECRET
})

testSuite('should be a function', () => {
  assert.type(mainConfig, 'function')
})

testSuite('should return config that is a function', () => {
  const { config } = mainConfig({
    path: configPath,
    env: {
      path: envPath
    }
  })
  assert.type(config, 'function')
})

testSuite('should throw that .env does not exist at default path', () => {
  assert.throws(
    () =>
      mainConfig({
        path: configPath
      }),
    (err) => err.message.endsWith('/.env does not exist.')
  )
})

testSuite('should throw that config does not exist at default path', () => {
  assert.throws(
    () =>
      mainConfig({
        env: {
          path: envPath
        }
      }),
    (err) => err.message.includes('/global.js')
  )
})

testSuite(
  'should throw that config for dev_invalid env does not export a function.',
  () => {
    assert.throws(
      () =>
        mainConfig({
          environments: ['dev_invalid'],
          path: configPath,
          env: {
            path: envPath
          }
        }),
      (err) =>
        err.message.endsWith('/dev_invalid.js does not export a function.')
    )
  }
)

testSuite('should add NODE_ENV to notOverridableOnWatch', () => {
  const params = {
    path: configPath,
    env: {
      path: envPath,
      notOverridableOnWatch: []
    }
  }
  assert.is(params.env.notOverridableOnWatch.length, 0)
  mainConfig(params)
  assert.is(params.env.notOverridableOnWatch.includes('NODE_ENV'), true)
})

testSuite('should be readonly', () => {
  const params = {
    path: configPath,
    env: {
      path: envPath
    }
  }
  const { config } = mainConfig(params)
  assert.is(config().version, 1)
  assert.throws(
    () => {
      config().version = 2
    },
    (err) =>
      err.message === 'Assignment to read-only properties is not allowed.'
  )
  assert.is(config().version, 1)
})

testSuite('should not be readonly', () => {
  const params = {
    path: configPath,
    readonly: false,
    env: {
      path: envPath
    }
  }
  const { config } = mainConfig(params)
  assert.is(config().version, 1)
  assert.not.throws(
    () => {
      config().version = 2
    },
    (err) =>
      err.message === 'Assignment to read-only properties is not allowed.'
  )
  assert.is(config().version, 2)
})

testSuite(
  'MC_VERSION should be overridable when featured in overridables',
  () => {
    const oldMCVersion = process.env.MC_VERSION
    process.env.MC_VERSION = 10
    const { config } = mainConfig({
      path: configPath,
      env: {
        path: envPath
      }
    })
    assert.is(config().version, 10)

    const { config: configV2 } = mainConfig({
      path: configPath,
      env: {
        path: envPath,
        overridable: ['MC_VERSION']
      }
    })
    assert.is(configV2().version, 1)
    process.env.MC_VERSION = oldMCVersion
  }
)

testSuite(
  'should override default environments & map to uppercased keys',
  () => {
    const { config } = mainConfig({
      environments: ['local', 'test'],
      path: configPath,
      env: {
        path: envPath
      }
    })
    assert.is(Object.keys(config().environments).length, 2)
    assert.is(config().environments.LOCAL, 'local')
    assert.is(config().environments.TEST, 'test')
    assert.is(config().env, config().environments.TEST)
  }
)

testSuite('should validate env against provided schema', () => {
  assert.throws(
    () =>
      mainConfig({
        path: configPath,
        env: {
          path: envPath,
          schema: {
            properties: {
              MC_TOKEN_SECRET: { type: 'number' }
            }
          }
        }
      }),
    (err) =>
      err.message ===
      'Invalid environment variable(s): MC_TOKEN_SECRET, should be number: {"type":"number"}'
  )

  assert.not.throws(() =>
    mainConfig({
      path: configPath,
      env: {
        path: envPath,
        schema: {
          properties: {
            MC_TOKEN_SECRET: { type: 'string' }
          }
        }
      }
    })
  )
})

testSuite('should validate config against provided schema', () => {
  assert.throws(
    () =>
      mainConfig({
        path: configPath,
        schema: {
          properties: {
            version: { type: 'string' }
          }
        },
        env: {
          path: envPath
        }
      }),
    (err) =>
      err.message ===
      'Invalid config. path: /version, should be string: {"type":"string"}'
  )

  assert.not.throws(() =>
    mainConfig({
      path: configPath,
      schema: {
        properties: {
          version: { type: 'number' }
        }
      },
      env: {
        path: envPath
      }
    })
  )
})

testSuite('should throw invalid params', () => {
  assert.throws(
    () =>
      mainConfig({
        path: configPath,
        schema: '{"type": "string"}',
        env: {
          path: envPath
        }
      }),
    (err) =>
      err.message ===
      'Invalid params. path: /schema, should be object: {"type":"object"}'
  )
})

testSuite('should throw invalid env schema', () => {
  assert.throws(
    () =>
      mainConfig({
        path: configPath,
        env: {
          path: envPath,
          schema: {
            properties: {
              invalidType: {
                type: 'invalid-type'
              }
            }
          }
        }
      }),
    (err) => err.message.startsWith('Invalid params.env.schema.')
  )
})

testSuite('should throw invalid config schema', () => {
  assert.throws(
    () =>
      mainConfig({
        path: configPath,
        schema: {
          properties: {
            invalidType: {
              type: 'invalid-type'
            }
          }
        },
        env: {
          path: envPath
        }
      }),
    (err) => err.message.startsWith('Invalid params.schema.')
  )
})

testSuite('should watch for changes', async () => {
  const oldVersion = 1
  const newVersion = 11
  const envBuffer = fs.readFileSync(watchEnvPath, { encoding: 'utf8' })
  changeWatchEnvValue(envBuffer, 'MC_VERSION', oldVersion)
  const { config, watchConfig, unwatchFile } = mainConfig({
    path: configPath,
    env: {
      watch: true,
      path: watchEnvPath
    }
  })
  assert.is(config().version, 1)

  const { newValue, oldValue } = await new Promise((resolve, reject) => {
    let timeout = null
    const unwatch = watchConfig('version', function (newValue, oldValue) {
      if (timeout) clearTimeout(timeout)
      unwatch()
      unwatchFile()
      changeWatchEnvValue(envBuffer, 'MC_VERSION', oldVersion)
      resolve({ newValue, oldValue })
    })
    changeWatchEnvValue(envBuffer, 'MC_VERSION', newVersion)
    timeout = setTimeout(() => {
      unwatch()
      unwatchFile()
      changeWatchEnvValue(envBuffer, 'MC_VERSION', oldVersion)
      reject(
        new Error(
          `Callback was not invoked within the specified timeout: ${timeoutDelay}ms`
        )
      )
    }, timeoutDelay)
  })

  assert.is(newValue, newVersion)
  assert.is(oldValue, oldVersion)
})

testSuite(
  'should watch for changes and config should not be readonly',
  async () => {
    const oldVersion = 1
    const newVersion = 11
    const envBuffer = fs.readFileSync(watchEnvPath, { encoding: 'utf8' })
    changeWatchEnvValue(envBuffer, 'MC_VERSION', oldVersion)
    const { config, watchConfig, unwatchFile } = mainConfig({
      path: configPath,
      readonly: false,
      env: {
        watch: true,
        path: watchEnvPath
      }
    })
    assert.is(config().version, 1)
    config().newVersion = 2
    assert.is(config().newVersion, 2)

    const { newValue, oldValue } = await new Promise((resolve, reject) => {
      let timeout = null
      const unwatch = watchConfig('version', function (newValue, oldValue) {
        if (timeout) clearTimeout(timeout)
        unwatch()
        unwatchFile()
        changeWatchEnvValue(envBuffer, 'MC_VERSION', oldVersion)
        resolve({ newValue, oldValue })
      })
      changeWatchEnvValue(envBuffer, 'MC_VERSION', newVersion)
      timeout = setTimeout(() => {
        unwatch()
        unwatchFile()
        changeWatchEnvValue(envBuffer, 'MC_VERSION', oldVersion)
        reject(
          new Error(
            `Callback was not invoked within the specified timeout: ${timeoutDelay}ms`
          )
        )
      }, timeoutDelay)
    })

    assert.is(newValue, newVersion)
    assert.is(oldValue, oldVersion)
  }
)

testSuite('should emit errors when watching for changes', async () => {
  const invalidEnv = 'dev'
  const validEnv = 'test'
  const envBuffer = fs.readFileSync(watchEnvPath, { encoding: 'utf8' })
  changeWatchEnvValue(envBuffer, 'NODE_ENV', validEnv)
  const { config, unwatchFile, watchError } = mainConfig({
    path: configPath,
    env: {
      watch: true,
      path: watchEnvPath
    }
  })
  assert.is(config().env, validEnv)

  await new Promise((resolve, reject) => {
    let timeout = null
    const unwatchError = watchError((err) => {
      if (timeout) clearTimeout(timeout)
      assert.instance(err, Error)
      unwatchError()
      unwatchFile()
      changeWatchEnvValue(envBuffer, 'NODE_ENV', validEnv)
      resolve()
    })
    changeWatchEnvValue(envBuffer, 'NODE_ENV', invalidEnv)
    timeout = setTimeout(() => {
      unwatchError()
      unwatchFile()
      changeWatchEnvValue(envBuffer, 'NODE_ENV', validEnv)
      reject(
        new Error(
          `Callback was not invoked within the specified timeout: ${timeoutDelay}ms`
        )
      )
    }, timeoutDelay)
  })
})

testSuite(
  'should not throw if watch functions are called when watch = false',
  () => {
    const { config, unwatchFile, watchConfig, watchError } = mainConfig({
      path: configPath,
      env: {
        path: envPath
      }
    })
    assert.not.throws(() => {
      const unwatch = watchConfig('version', () => {})
      unwatch()
      const unwatchError = watchError()
      unwatchError()
      unwatchFile()
    })
    assert.type(config, 'function')
  }
)
testSuite('should throw if env is not listed in environments', () => {
  const oldEnv = process.env.NODE_ENV
  process.env.NODE_ENV = 'invalid_env'

  assert.throws(
    () =>
      mainConfig({
        path: configPath,
        env: {
          path: envPath
        }
      }),
    (err) =>
      err.message ===
      'Invalid environment variable: NODE_ENV, should be equal to one of the allowed values: {"allowedValues":["local","development","staging","production","test"]}'
  )

  process.env.NODE_ENV = oldEnv
})

testSuite.run()