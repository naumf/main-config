'use strict'

let proxyCache

function createReadonlyProxy(target, handler) {
  return new Proxy(target, handler)
}

function readonlyTrap() {
  throw new Error(`Assignment to read-only properties is not allowed.`)
}

const handler = {
  set: readonlyTrap,
  defineProperty: readonlyTrap,
  deleteProperty: readonlyTrap,
  preventExtensions: readonlyTrap,
  setPrototypeOf: readonlyTrap,
  get: function (target, key, receiver) {
    const result = Reflect.get(target, key, receiver)
    if (Object(result) !== result) return result
    let proxy
    if (proxyCache.has(result)) {
      proxy = proxyCache.get(result)
    } else {
      proxy = createReadonlyProxy(result, handler)
      proxyCache.set(result, proxy)
    }
    return proxy
  }
}

function readonly(target, cache, replaceCache) {
  if (!proxyCache || replaceCache) {
    proxyCache = cache || new WeakMap()
  }
  return createReadonlyProxy(target, handler)
}

module.exports = readonly
