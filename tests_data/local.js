'use strict'

module.exports = () => {
  return {
    modules: {
      auth: {
        token: {
          expiresInSeconds: 60 * 60 * 48
        }
      },
      swagger: {
        schemes: ['http']
      }
    }
  }
}
