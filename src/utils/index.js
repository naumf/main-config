'use strict'

const buildConfig = require('./buildConfig')
const diffMerge = require('./diffMerge')
const file = require('./file')
const hasOwnProp = require('./hasOwnProp')
const isInvalidProp = require('./isInvalidProp')
const isNullish = require('./isNullish')
const isObject = require('./isObject')
const readonly = require('./readonly')
const schema = require('./schema')

module.exports = {
  buildConfig,
  diffMerge,
  file,
  hasOwnProp,
  isInvalidProp,
  isNullish,
  isObject,
  readonly,
  schema
}
