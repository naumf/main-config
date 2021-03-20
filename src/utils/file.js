'use strict'

const fs = require('fs')
const path = require('path')

function checkFileAccess(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK | fs.constants.R_OK)
  } catch (err) {
    throw new Error(
      `${filePath} ${
        /* c8 ignore next */
        err.code === 'ENOENT' ? 'does not exist.' : 'is not readable.'
      }`
    )
  }
}

function watchFile(filePath, cb) {
  let mtimeMs = null
  const directory = path.dirname(filePath)
  const file = path.basename(filePath)
  /*
    It's watching the directory instead of the file on purpose.
    If it's watching the file instead of the directory on Ubuntu 20.04, the following happens:
    - if file is modified and saved multiple times with VS Code the event is fired
    multiple times, as expected
    - if file is modified and saved multiple times with another text editor
    i.e. Geany the event is firing only once
    For more info check this issue: https://github.com/nodejs/node/issues/22517
  */
  return fs.watch(directory, function (_eventType, filename) {
    /* c8 ignore next 3 */
    if (filename !== file) {
      return
    }
    fs.stat(filePath, function (err, stats) {
      /* c8 ignore next 4 */
      if (err) {
        cb(err)
        return
      }
      /* c8 ignore next 3 */
      if (mtimeMs === stats.mtimeMs) {
        return
      }
      mtimeMs = stats.mtimeMs
      /* c8 ignore next 3 */
      if (!stats.size) {
        return
      }
      cb()
    })
  })
}

module.exports = {
  checkFileAccess,
  watchFile
}
