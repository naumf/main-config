'use strict'

function isInvalidProp(property) {
  return ['__proto__', 'constructor', 'prototype'].indexOf(property) !== -1
}

module.exports = isInvalidProp
