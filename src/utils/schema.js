'use strict'

const Ajv = require('ajv').default
const diffMerge = require('./diffMerge')

const ajv = new Ajv({
  $data: true,
  removeAdditional: true,
  useDefaults: true,
  coerceTypes: false,
  allErrors: true,
  allowUnionTypes: true
})

const defaultEnvironments = [
  'local',
  'development',
  'staging',
  'production',
  'test'
]

const paramsSchema = {
  type: 'object',
  properties: {
    environments: {
      type: 'array',
      items: {
        type: 'string',
        pattern: '^[a-z0-9_:]{1,}$'
      },
      minItems: 1,
      default: defaultEnvironments
    },
    readonly: {
      type: ['string', 'boolean'],
      enum: ['freeze', 'proxy', false, true],
      default: 'freeze'
    },
    schema: {
      type: 'object',
      additionalProperties: true,
      default: {}
    },
    path: { type: 'string', default: '' },
    noWarnings: { type: 'boolean', default: false },
    env: {
      type: 'object',
      properties: {
        path: { type: 'string', default: '' },
        watch: { type: 'boolean', default: false },
        schema: {
          type: 'object',
          additionalProperties: true,
          default: {}
        },
        overridable: {
          type: 'array',
          items: { type: 'string' },
          default: []
        },
        notOverridableOnWatch: {
          type: 'array',
          items: { type: 'string' },
          default: ['NODE_ENV', 'MAIN_CONFIG_ENV']
        }
      },
      default: {}
    }
  },
  additionalProperties: false
}

function stringifyParams(params) {
  /* c8 ignore next */
  return params ? '\n  - params: ' + JSON.stringify(params) : ''
}

function createAjvErrors(messagePrefix = '', errors = []) {
  return new Error(
    `${messagePrefix}\n` +
      errors
        .map((e) =>
          e.instancePath
            ? `- path: ${e.instancePath} ${e.message}.${stringifyParams(
                e.params
              )}`
            : `- ${e.message}`
        )
        .join('\n')
  )
}

function createEnvSchemaErrors(errors = []) {
  return new Error(
    'Invalid environment variable(s):\n' +
      errors
        .map((e) =>
          e.instancePath
            ? `- ${e.instancePath.slice(1)} ${e.message}.${stringifyParams(
                e.params
              )}`
            : `- ${e.message}`
        )
        .join('\n')
  )
}

function validateParamsSchema(params = {}) {
  const ajvInstance = params.ajv || ajv
  const validateParams = ajvInstance.compile(paramsSchema)
  const valid = validateParams(params)
  if (!valid) {
    throw createAjvErrors('Invalid params:', validateParams.errors)
  }

  const envSchemaValid = ajvInstance.validateSchema(params.env.schema)
  if (!envSchemaValid) {
    throw createAjvErrors('Invalid params.env.schema:', ajvInstance.errors)
  }
  params.env.schema = diffMerge(params.env.schema, {
    type: 'object',
    required: [...(params.env.schema.required || []), 'MAIN_CONFIG_ENV'],
    additionalProperties: true,
    properties: {
      MAIN_CONFIG_ENV: {
        enum: [...params.environments]
      }
    }
  })
  const validateEnvSchema = ajvInstance.compile(params.env.schema)

  const configSchemaValid = ajvInstance.validateSchema(params.schema)
  if (!configSchemaValid) {
    throw createAjvErrors('Invalid params.schema:', ajvInstance.errors)
  }
  params.schema = diffMerge(params.schema, {
    type: 'object',
    required: ['environments', 'env'],
    properties: {
      environments: {
        type: 'object',
        propertyNames: { type: 'string' },
        additionalProperties: {
          type: 'string',
          minLength: 1
        }
      },
      env: { enum: [...params.environments] }
    }
  })
  const validateConfigSchema = ajvInstance.compile(params.schema)

  return { validateEnvSchema, validateConfigSchema }
}

module.exports = {
  validateParamsSchema,
  createAjvErrors,
  createEnvSchemaErrors
}
