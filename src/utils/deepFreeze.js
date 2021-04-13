'use strict'

function deepFreeze(obj) {
  const propNames = Object.getOwnPropertyNames(obj)
  for (const name of propNames) {
    const value = obj[name]
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      /* c8 ignore next 2 */
      if (value instanceof Date) {
        obj[name] = value.getTime()
      } else {
        deepFreeze(value)
      }
    }
  }
  return Object.freeze(obj)
}

module.exports = deepFreeze
