'use strict'

const { suite } = require('uvu')
const assert = require('uvu/assert')
const { types } = require('util')
const sinon = require('sinon')
const { readonly } = require('../../src/utils')

process.env.TEST_ENV = 'test'

const config = {
  version: 1,
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
        secret: 'T0p s3cr3T'
      }
    },
    swagger: {
      schemes: ['https']
    }
  },
  // NOTE: this is here on purpose
  swagger: {
    schemes: ['https']
  }
}

const readonlyConfig = readonly(config)

const testSuite = suite('readonly')

testSuite('should be a function', () => {
  assert.type(readonly, 'function')
})

testSuite('should return a proxy', () => {
  assert.is(types.isProxy(config), false)
  assert.is(types.isProxy(readonlyConfig), true)
})

testSuite('should match all values', () => {
  assert.is(config.server.port, readonlyConfig.server.port)
  assert.is(config.db.host, readonlyConfig.db.host)
  assert.is(config.db.port, readonlyConfig.db.port)
  assert.is(config.db.username, readonlyConfig.db.username)
  assert.is(
    config.modules.auth.token.secret,
    readonlyConfig.modules.auth.token.secret
  )
  assert.is(
    config.modules.swagger.schemes.length,
    readonlyConfig.modules.swagger.schemes.length
  )
  assert.is(
    config.modules.swagger.schemes[0],
    readonlyConfig.modules.swagger.schemes[0]
  )
})

testSuite(
  'should be readonly for all props and all operations on any depth',
  () => {
    // modyfing props
    assert.throws(() => (readonlyConfig.server.port = 3001))
    assert.throws(() => (readonlyConfig.server = {}))
    assert.throws(() => (readonlyConfig.db.host = 'localhost'))
    assert.throws(() => (readonlyConfig.db.port = 5433))
    assert.throws(() => (readonlyConfig.db.username = 'postgres13'))
    assert.throws(() => (readonlyConfig.db = {}))
    assert.throws(
      () => (readonlyConfig.modules.auth.token.secret = 'new secret')
    )
    assert.throws(() => (readonlyConfig.modules.auth.token = {}))
    assert.throws(() => (readonlyConfig.modules.auth = {}))
    assert.throws(() => (readonlyConfig.modules = {}))
    assert.throws(() => (readonlyConfig.modules.swagger.schemes[0] = 'http'))
    assert.throws(() => (readonlyConfig.modules.swagger.schemes = []))
    assert.throws(() => (readonlyConfig.modules.swagger = {}))

    // adding props with assignment operator
    assert.throws(() => (readonlyConfig.server.timeout = 5000))
    assert.throws(() => (readonlyConfig.db.password = 'new password'))
    assert.throws(
      () => (readonlyConfig.modules.auth.token.expiresInSeconds = 60 * 60 * 24)
    )
    assert.throws(() => (readonlyConfig.modules.auth.cookie = {}))
    assert.throws(() => (readonlyConfig.modules.swagger.oas = 3))
    assert.throws(() => (readonlyConfig.modules.security = {}))
    assert.throws(() => (readonlyConfig.storage = {}))

    // adding props with Object.defineProperty|Object.defineProperties
    assert.throws(() =>
      Object.defineProperty(readonlyConfig.password, 'timeout', {
        value: 5000
      })
    )
    assert.throws(() =>
      Object.defineProperty(readonlyConfig.db, 'password', {
        value: 'new password'
      })
    )
    assert.throws(() =>
      Object.defineProperty(
        readonlyConfig.modules.auth.token,
        'expiresInSeconds',
        {
          value: 60 * 60 * 24
        }
      )
    )
    assert.throws(() =>
      Object.defineProperty(readonlyConfig.modules.auth, 'cookie', {
        value: {}
      })
    )
    assert.throws(() =>
      Object.defineProperty(readonlyConfig.modules.swagger, 'oas', {
        value: 3
      })
    )
    assert.throws(() =>
      Object.defineProperties(readonlyConfig.modules.swagger, {
        security: {
          value: {}
        }
      })
    )
    assert.throws(() =>
      Object.defineProperty(readonlyConfig.modules, 'security', {
        value: {}
      })
    )

    assert.throws(() =>
      Object.defineProperty(readonlyConfig, 'storage', {
        value: {}
      })
    )

    // deleting props
    assert.throws(() => delete readonlyConfig.server.port)
    assert.throws(() => delete readonlyConfig.server)
    assert.throws(() => delete readonlyConfig.db.host)
    assert.throws(() => delete readonlyConfig.db.port)
    assert.throws(() => delete readonlyConfig.db.username)
    assert.throws(() => delete readonlyConfig.db)
    assert.throws(() => delete readonlyConfig.modules.auth.token.secret)
    assert.throws(() => delete readonlyConfig.modules.auth.token)
    assert.throws(() => delete readonlyConfig.modules.auth)
    assert.throws(() => delete readonlyConfig.modules)
    assert.throws(() => delete readonlyConfig.modules.swagger.schemes[0])
    assert.throws(() => delete readonlyConfig.modules.swagger.schemes)
    assert.throws(() => delete readonlyConfig.modules.swagger)

    // modifying prototype
    const proto = {
      modified: true
    }
    assert.throws(() => Object.setPrototypeOf(readonlyConfig.server, null))
    assert.throws(() => Reflect.setPrototypeOf(readonlyConfig.db, proto))
    assert.throws(() =>
      Object.setPrototypeOf(readonlyConfig.modules.auth.token, proto)
    )
    assert.throws(() =>
      Reflect.setPrototypeOf(readonlyConfig.modules.auth, proto)
    )
    assert.throws(() =>
      Object.setPrototypeOf(readonlyConfig.modules.swagger, proto)
    )
    assert.throws(() => Reflect.setPrototypeOf(readonlyConfig.modules, proto))
    assert.throws(() => Object.setPrototypeOf(readonlyConfig, proto))
  }
)

testSuite('should match updated values', () => {
  assert.is(config.server.port, readonlyConfig.server.port)
  const oldPort = config.server.port
  config.server.port = 3001
  assert.is(config.server.port, readonlyConfig.server.port)
  config.server.port = oldPort

  assert.is(
    config.modules.auth.token.secret,
    readonlyConfig.modules.auth.token.secret
  )
  const oldSecret = config.modules.auth.token.secret
  config.modules.auth.token.secret = 'new secret'
  assert.is(
    config.modules.auth.token.secret,
    readonlyConfig.modules.auth.token.secret
  )
  config.modules.auth.token.secret = oldSecret

  const oldVersion = config.version
  config.version = 2
  assert.is(config.version, readonlyConfig.version)
  config.version = oldVersion
})

testSuite('should use cached proxies', () => {
  const cache = new WeakMap()
  const cacheSpy = sinon.spy(cache)
  const readonlyConfig = readonly(config, cache, true)

  assert.is(cacheSpy.get.callCount, 0)
  assert.is(cacheSpy.set.callCount, 0)

  assert.is(config.server.port, readonlyConfig.server.port)
  assert.is(cacheSpy.get.callCount, 0)
  assert.is(cacheSpy.set.callCount, 1)

  cacheSpy.get.resetHistory()
  cacheSpy.set.resetHistory()

  assert.is(cacheSpy.get.callCount, 0)
  assert.is(cacheSpy.set.callCount, 0)
  assert.is(config.server.port, readonlyConfig.server.port)
  assert.is(cacheSpy.get.callCount, 1)
  assert.is(cacheSpy.set.callCount, 0)

  cacheSpy.get.resetHistory()
  cacheSpy.set.resetHistory()

  assert.is(cacheSpy.get.callCount, 0)
  assert.is(cacheSpy.set.callCount, 0)
  assert.is(
    readonlyConfig.modules.swagger.schemes[0],
    config.modules.swagger.schemes[0]
  )
  assert.is(cacheSpy.get.callCount, 0)
  assert.is(cacheSpy.set.callCount, 3)

  cacheSpy.get.resetHistory()
  cacheSpy.set.resetHistory()

  assert.is(cacheSpy.get.callCount, 0)
  assert.is(cacheSpy.set.callCount, 0)
  assert.is(
    readonlyConfig.modules.swagger.schemes[0],
    config.modules.swagger.schemes[0]
  )
  assert.is(cacheSpy.get.callCount, 3)
  assert.is(cacheSpy.set.callCount, 0)

  cacheSpy.get.resetHistory()
  cacheSpy.set.resetHistory()

  assert.is(cacheSpy.get.callCount, 0)
  assert.is(cacheSpy.set.callCount, 0)
  assert.is(
    readonlyConfig.modules.auth.token.secret,
    config.modules.auth.token.secret
  )
  assert.is(cacheSpy.get.callCount, 1)
  assert.is(cacheSpy.set.callCount, 2)
})

testSuite.run()
