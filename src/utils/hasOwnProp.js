'use strict'

function hasOwnProp(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop)
}

module.exports = hasOwnProp
