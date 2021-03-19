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

function checkForChanges(patch, cmp, changeHandler, path) {
  if (changeHandler) {
    const { diff, newValue, oldValue } = compare(cmp, patch, path)
    if (diff) changeHandler(path, newValue, oldValue)
  }
}

function prepareTarget(target) {
  if (!isObject(target) || isNullish(target)) {
    target = {}
  } else if (Array.isArray(target)) {
    target = cloneArray(target)
  } else if (isObject(target)) {
    target = Object.assign({}, target)
  }
  return target
}

function getPropertyPath(path, prop) {
  return (path && `${path}.${prop}`) || prop
}

function isPropNotOk(obj, prop) {
  return !hasOwnProp(obj, prop) || isInvalidProp(prop)
}

function _diffMerge(target, patch, cmp, changeHandler, path) {
  if (patch instanceof Date) {
    patch = new Date(patch)
    checkForChanges(patch, cmp, changeHandler, path)
    return patch
  }
  if (!isObject(patch)) {
    checkForChanges(patch, cmp, changeHandler, path)
    return patch
  }
  if (Array.isArray(patch)) {
    patch = cloneArray(patch)
    checkForChanges(patch, cmp, changeHandler, path)
    return patch
  }

  target = prepareTarget(target)

  const targetNames = []

  for (const name in patch) {
    targetNames.push(name)
    if (isPropNotOk(patch, name)) continue
    target[name] = _diffMerge(
      target[name],
      patch[name],
      cmp,
      changeHandler,
      getPropertyPath(path, name)
    )
  }

  for (const name in target) {
    if (targetNames.indexOf(name) !== -1 || isPropNotOk(target, name)) continue
    target[name] = _diffMerge(
      target[name],
      target[name],
      cmp,
      changeHandler,
      getPropertyPath(path, name)
    )
  }

  return target
}

function diffMerge(target = {}, patch = {}, cmp = {}, changeHandler = null) {
  return _diffMerge(
    target,
    patch,
    cmp,
    typeof changeHandler === 'function' ? changeHandler : null,
    ''
  )
}

module.exports = diffMerge
