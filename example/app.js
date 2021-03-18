'use strict'

const { config, watchConfig, watchError, unwatchFile } = require('./config')

console.log(require('util').inspect(config(), null, null))

// Uncomment below line to test readonly
// config().modules.newModule = { test: 'data' }

const unwatch = watchConfig(
  'modules.auth.token.secret',
  function (newValue, oldValue) {
    console.log(
      `path: "modules.auth.token.secret", newValue: ${newValue}, oldValue: ${oldValue}`
    )
    unwatch()
  }
)
watchConfig('version', function (newValue, oldValue) {
  console.log(`path: "version", newValue: ${newValue}, oldValue: ${oldValue}`)
})

watchConfig('*', function (changes) {
  console.log('*', changes)
})

watchError((err) => {
  console.error(err)
})

setTimeout(() => unwatchFile(), 15000)
