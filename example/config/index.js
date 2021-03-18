'use strict'

const path = require('path')
const mainConfig = require('../../index')

const configSchema = {
  properties: {
    version: { type: 'number' }
  }
}

const envSchema = {
  properties: {
    PORT: { type: 'number', default: 3000 }
  }
}

module.exports = mainConfig({
  schema: configSchema,
  env: {
    watch: true,
    path: path.join(__dirname, '.env'),
    schema: envSchema,
    overridable: ['NODE_ENV']
  }
})
