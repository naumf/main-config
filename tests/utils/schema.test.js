'use strict'

const { suite } = require('uvu')
const assert = require('uvu/assert')
const {
  schema: { createAjvErrors, createEnvSchemaErrors }
} = require('../../src/utils')

const testSuite = suite('schema')

testSuite(
  'createAjvErrors should return error with specified message prefix and should not throw if params are missing',
  () => {
    const prefix = 'Ajv Error: '
    const error = createAjvErrors(prefix, [{ message: 'Some error.' }])
    assert.instance(error, Error)
    assert.is(error.message.startsWith('Ajv Error: '), true)
    assert.not.throws(() =>
      createAjvErrors(prefix, [
        { message: 'Another error.', dataPath: '/path' }
      ])
    )
  }
)

testSuite(
  'createEnvSchemaErrors should return error with specified message prefix and should not throw if params are missing',
  () => {
    const error = createEnvSchemaErrors([{ message: 'Some error.' }])
    assert.instance(error, Error)
    assert.not.throws(() =>
      createEnvSchemaErrors([{ message: 'Another error.', dataPath: '/path' }])
    )
  }
)

testSuite.run()
