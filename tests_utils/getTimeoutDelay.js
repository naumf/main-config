'use strict'

function getTimeoutDelay() {
  const arg = process.argv.find((i) => i.startsWith('--timeout-delay='))
  if (arg) {
    return parseInt(arg.replace('--timeout-delay=', ''), 10)
  }
  return 500
}

module.exports = getTimeoutDelay
