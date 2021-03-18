'use strict'

const { dequal } = require('dequal/lite')

const hasOwnProp = require('./hasOwnProp')
const isInvalidProp = require('./isInvalidProp')
const isNullish = require('./isNullish')
const isObject = require('./isObject')

function cloneObject(obj) {
  if (obj instanceof Date) return new Date(obj)
  const cloned = {}
  for (const name in obj) {
    if (!hasOwnProp(obj, name) || isInvalidProp(name)) continue
    const value = obj[name]
    if (isNullish(value)) {
      cloned[name] = value
    } else if (Array.isArray(value)) {
      cloned[name] = cloneArray(value)
    } else if (isObject(value)) {
      if (value instanceof Date) {
        cloned[name] = new Date(value)
      } else {
        cloned[name] = Object.assign({}, cloneObject(value))
      }
    } else {
      cloned[name] = value
    }
  }
  return cloned
}

function cloneArray(arr) {
  const cloned = []
  for (const item of arr) {
    if (!isObject(item)) {
      cloned.push(item)
    } else if (Array.isArray(item)) {
      cloned.push(cloneArray(item))
    } else {
      cloned.push(cloneObject(item))
    }
  }
  return cloned
}

function compare(cmp, val2, path) {
  if (!path) return { diff: false, newValue: null, oldValue: null }
  const names = path.split('.')
  let val1 = cmp
  for (const name of names) {
    val1 = val1[name]
  }
  return {
    diff: !dequal(val1, val2),
    newValue: val2,
    oldValue: val1
  }
}

function diffMerge(target = {}, patch = {}, cmp = {}, changeHandler = null) {
  function _diffMerge(target, patch, cmp, changeHandler, path) {
    if (patch instanceof Date) {
      patch = new Date(patch)
      if (changeHandler) {
        const { diff, newValue, oldValue } = compare(cmp, patch, path)
        if (diff) changeHandler(path, newValue, oldValue)
      }
      return patch
    }
    if (!isObject(patch)) {
      if (changeHandler) {
        const { diff, newValue, oldValue } = compare(cmp, patch, path)
        if (diff) changeHandler(path, newValue, oldValue)
      }
      return patch
    }
    if (Array.isArray(patch)) {
      patch = cloneArray(patch)
      if (changeHandler) {
        const { diff, newValue, oldValue } = compare(cmp, patch, path)
        if (diff) changeHandler(path, newValue, oldValue)
      }
      return patch
    }

    if (!isObject(target) || isNullish(target)) {
      target = {}
    } else if (Array.isArray(target)) {
      target = cloneArray(target)
    } else if (isObject(target)) {
      target = Object.assign({}, target)
    }

    const targetNames = []

    for (const name in patch) {
      targetNames.push(name)
      if (!hasOwnProp(patch, name) || isInvalidProp(name)) continue
      target[name] = _diffMerge(
        target[name],
        patch[name],
        cmp,
        changeHandler,
        (path && `${path}.${name}`) || name
      )
    }

    for (const name in target) {
      if (
        targetNames.indexOf(name) !== -1 ||
        !hasOwnProp(target, name) ||
        isInvalidProp(name)
      ) {
        continue
      }
      target[name] = _diffMerge(
        target[name],
        target[name],
        cmp,
        changeHandler,
        (path && `${path}.${name}`) || name
      )
    }

    return target
  }

  return _diffMerge(
    target,
    patch,
    cmp,
    typeof changeHandler === 'function' ? changeHandler : null,
    ''
  )
}

module.exports = diffMerge
