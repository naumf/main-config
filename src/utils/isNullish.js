'use strict'

function isNullish(value) {
  return [null, undefined].indexOf(value) !== -1
}

module.exports = isNullish
