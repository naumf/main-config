'use strict'

module.exports = () => {
  return {
    version: Number(process.env.MC_VERSION),
    server: {
      port: process.env.PORT
    },
    db: {
      host: process.env.MC_DB_HOST,
      port: process.env.MC_DB_PORT,
      username: process.env.MC_DB_USERNAME
    },
    modules: {
      auth: {
        token: {
          secret: process.env.MC_TOKEN_SECRET
        }
      },
      swagger: {
        schemes: ['https']
      }
    }
  }
}
