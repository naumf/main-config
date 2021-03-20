'use strict'

let proxyCache

function createReadonlyProxy(target, handler) {
  return new Proxy(target, handler)
}

function readonlyTrap() {
  throw new Error(`Assignment to read-only properties is not allowed.`)
}

function getTrap(target, key, receiver) {
  const result = Reflect.get(target, key, receiver)
  if (Object(result) !== result) {
    return result
  }
  let proxy
  if (proxyCache.has(result)) {
    proxy = proxyCache.get(result)
  } else {
    proxy = createReadonlyProxy(result, proxyHandler)
    proxyCache.set(result, proxy)
  }
  return proxy
}

const proxyHandler = {
  set: readonlyTrap,
  defineProperty: readonlyTrap,
  deleteProperty: readonlyTrap,
  preventExtensions: readonlyTrap,
  setPrototypeOf: readonlyTrap,
  get: getTrap
}

function readonly(target, cache, replaceCache) {
  if (!proxyCache || replaceCache) {
    proxyCache = cache || new WeakMap()
  }
  return createReadonlyProxy(target, proxyHandler)
}

module.exports = readonly
