'use strict'

const { suite } = require('uvu')
const assert = require('uvu/assert')
const { diffMerge } = require('../../src/utils')
const sinon = require('sinon')

process.env.TEST_ENV = 'test'

const oldConfig = {
  version: 1,
  versionDate: new Date(),
  server: {
    port: 3000
  },
  env: process.env.TEST_ENV,
  db: {
    host: '127.0.0.1',
    port: 5432,
    username: 'postgres'
  },
  modules: {
    auth: {
      token: {
        secret: 'T0p s3cr3T',
        expiresInSeconds: 60 * 60 * 24
      }
    },
    swagger: {
      schemes: ['https']
    }
  }
}

const testSuite = suite('diffMerge')

testSuite('should be a function', () => {
  assert.type(diffMerge, 'function')
})

testSuite(
  'should merge 2 objects and notify about diffs with previous merge',
  () => {
    const newBaseConfig = {
      version: 1,
      versionDate: new Date(), // changed
      server: {
        port: 3000
      },
      env: process.env.TEST_ENV,
      db: {
        host: '127.0.0.1',
        port: 5433, // changed
        username: 'postgres_change' // changed
      },
      modules: {
        auth: {
          token: {
            secret: 'T0p s3cr3T',
            expiresInSeconds: 60 * 60 * 24
          }
        },
        swagger: {
          schemes: ['https']
        }
      }
    }
    const newEnvConfig = {
      modules: {
        auth: {
          token: {
            expiresInSeconds: 60 * 60 * 12 // changed
          }
        },
        swagger: {
          schemes: ['http'] // changed
        }
      }
    }
    const expectedNewConfig = {
      version: 1,
      versionDate: newBaseConfig.versionDate,
      server: {
        port: 3000
      },
      env: process.env.TEST_ENV,
      db: {
        host: '127.0.0.1',
        port: 5433,
        username: 'postgres_change'
      },
      modules: {
        auth: {
          token: {
            secret: 'T0p s3cr3T',
            expiresInSeconds: 60 * 60 * 12
          }
        },
        swagger: {
          schemes: ['http']
        }
      }
    }

    const changesMade = 5
    const changeHandler = sinon.fake()

    const newConfig = diffMerge(
      newBaseConfig,
      newEnvConfig,
      oldConfig,
      changeHandler
    )

    assert.equal(expectedNewConfig, newConfig)

    assert.is(changeHandler.callCount, changesMade)

    assert.is(
      changeHandler.calledWith(
        'versionDate',
        expectedNewConfig.versionDate,
        oldConfig.versionDate
      ),
      true
    )

    assert.is(
      changeHandler.calledWith(
        'db.port',
        expectedNewConfig.db.port,
        oldConfig.db.port
      ),
      true
    )

    assert.is(
      changeHandler.calledWith(
        'db.username',
        expectedNewConfig.db.username,
        oldConfig.db.username
      ),
      true
    )

    assert.is(
      changeHandler.calledWith(
        'db.username',
        expectedNewConfig.db.username,
        oldConfig.db.username
      ),
      true
    )

    assert.is(
      changeHandler.calledWith(
        'modules.auth.token.expiresInSeconds',
        expectedNewConfig.modules.auth.token.expiresInSeconds,
        oldConfig.modules.auth.token.expiresInSeconds
      ),
      true
    )

    assert.is(
      changeHandler.calledWith(
        'modules.swagger.schemes',
        expectedNewConfig.modules.swagger.schemes,
        oldConfig.modules.swagger.schemes
      ),
      true
    )
  }
)

testSuite('should clone object', () => {
  const newEnvConfig = {
    testArrObj: [
      { k: 'v', d: new Date(), a: [1, 2], o: { k1: 'v1' }, n: null },
      new Date(),
      [1]
    ],
    modules: {
      auth: {
        token: {
          expiresInSeconds: 60 * 60 * 12 // changed
        }
      },
      swagger: {
        schemes: ['http'] // changed
      }
    }
  }

  const clonedEnvConfig = diffMerge(newEnvConfig)

  assert.equal(clonedEnvConfig, newEnvConfig)
  assert.is.not(clonedEnvConfig, newEnvConfig)
  assert.is.not(clonedEnvConfig.testArrObj, newEnvConfig.testArrObj)
  assert.is.not(clonedEnvConfig.testArrObj[0], newEnvConfig.testArrObj[0])
  assert.is.not(clonedEnvConfig.modules, newEnvConfig.modules)
  assert.is.not(clonedEnvConfig.modules.auth, newEnvConfig.modules.auth)
  assert.is.not(
    clonedEnvConfig.modules.auth.token,
    newEnvConfig.modules.auth.token
  )
  assert.is.not(clonedEnvConfig.modules.swagger, newEnvConfig.modules.swagger)
  assert.is.not(
    clonedEnvConfig.modules.swagger.schemes,
    newEnvConfig.modules.swagger.schemes
  )
})

testSuite('should clone array', () => {
  const newEnvConfigs = [{ k: 'v' }, { k1: 'v1' }]
  const clonedEnvConfigs = diffMerge(newEnvConfigs)

  assert.equal(clonedEnvConfigs, newEnvConfigs)
  assert.is.not(clonedEnvConfigs, newEnvConfigs)
  assert.is.not(clonedEnvConfigs[0], newEnvConfigs[0])
  assert.is.not(clonedEnvConfigs[1], newEnvConfigs[1])
})

testSuite('should return patch if target is null', () => {
  const target = null
  const patch = { k: 'v' }

  const result = diffMerge(target, patch)

  assert.equal(result, patch)
  assert.is(target, null)
})

testSuite('should not run change handler', () => {
  const changeHandler = sinon.fake()
  diffMerge([1], [2], {}, changeHandler)

  assert.is(changeHandler.callCount, 0)
})

testSuite('should avoid merging invalid props', () => {
  const invalidProp = '__proto__'
  const patch = {
    arr: [
      {
        k: 'v',
        [invalidProp]: {
          injectProp: 'data'
        }
      }
    ],
    [invalidProp]: {
      injectProp: 'data'
    }
  }

  const target = {}

  const result = diffMerge(target, patch)

  assert.type(result[invalidProp].injectProp, 'undefined')
  assert.type(target[invalidProp].injectProp, 'undefined')
  assert.not.type(result.arr, 'undefined')
  assert.type(result.arr[0][invalidProp].injectProp, 'undefined')
  assert.type(target.arr, 'undefined')
  assert.is(result.arr[0].k, 'v')
})

testSuite.run()
