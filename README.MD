# main-config
Load, merge (global with env specific) and validate configuration files.

## Features
- one global (shared) config file gets merged with env specific file based on `MAIN_CONFIG_ENV` value.
- environment variables are loaded from .env file with [dotenv](https://github.com/motdotla/dotenv).
- watch for .env changes, reload config and emit changes. Uses [dequal](https://github.com/lukeed/dequa) to check for changes.
- validate environment variables and merged config using [Ajv](https://github.com/ajv-validator/ajv) schema.
- readonly.

## Install

npm:
```sh
npm i main-config --save
```
yarn:
```sh
yarn add main-config
```

## Usage
- See `example` folder in [this](https://github.com/naumf/main-config) repo.

## API

```ts
mainConfig(params?: Params): MainConfig
```

### Params

- `ajv?: Ajv` (**default**: ajv instance)
  - Use this to pass your own Ajv version 7 instance (i.e. if you need to have different Ajv initialization options, or you need to use ajv-keywords, ajv-formats etc.)
- `environments?: Array<string>` (**default**: `['local', 'development', 'staging', 'production', 'test']`)
  - List your different environments here
- `readonly?: 'freeze' | 'proxy' | false | true` (**default**: 'freeze')
  - Set this to `false` if you want the returned object using `config()` method to be mutable. Check [Caveats](#user-content-caveats) section for more info.
  - If set to `'freeze'` the returned object is deep readonly via Object.freeze.
  - If set to `'proxy'` the returned object is deep readonly via Proxy traps.
  - If set to `true` the returned object is deep readonly via the default readonly option: `'freeze'`.
- `schema?: Object`
  - Validate the object returned with `config()` method. Check [Ajv JSON Schema](https://github.com/ajv-validator/ajv/blob/master/docs/json-schema.md) for more info.
- `path?: String` (**default**: The path of the folder where this module is required)
- `noWarnings?: Boolean` (**default**: false)
- `env?: EnvOptions`

#### EnvOptions

- `path?: String` (**default**: The current working directory of the Node.js process)
  - The path of the `.env` file
- `watch?: Boolean` (**default**: false)
  - Set this to `true` to watch `.env` file for changes
- `schema?: Object`
  - Validate environment variables. Check [Ajv JSON Schema](https://github.com/ajv-validator/ajv/blob/master/docs/json-schema.md) for more info. Merges with default schema.
  - **default**:
  ```js
  {
    type: 'object',
    required: ['MAIN_CONFIG_ENV'],
    additionalProperties: true,
    properties: {
      MAIN_CONFIG_ENV: {
        enum: [...params.environments]
      }
    }
  }
  ```
- `overridable?: Array<string>`
  - Use this if you want to override any environment variable that is already set on your system. i.e. If process.env.NODE_ENV is set to `development` and you want to override it with something set in `.env` file, set property to `['NODE_ENV']` and process.env.NODE_ENV will be overridden.
- `notOverridableOnWatch?: Array<string>` (**default**: `['NODE_ENV', 'MAIN_CONFIG_ENV']`)
  - Use this if you don't want some environment variable to be overriden on watch (during runtime). Merges with default.

### MainConfig
- `config: Function`
  - This function returns the main config object.
- `watchConfig?: Function`
  - If `watch=true` use this function to watch `'*'` all properties for changes, or `'path.to.property'` to watch single property for changes.
  - This function returns `unwatch` function, that can be used to stop the current listener from watching for changes.
  - Usage: check `example/app.js`.
- `watchError?: Function`
  - If `watch=true` use this function to watch for errors that can happen from .env modifications.
  - Usage: check `example/app.js`.
- `unwatchFile?: Function`
  - If `watch=true` use this function to stop watching `.env` for changes.
  - Usage: check `example/app.js`.

## Caveats
- If `readonly = false` and `watch = true` all changes made to the config will be lost after .env file is modified and watch is being triggered.

## Notes
- Do not commit .env file to your repo, it's commited here for the sake of the example.

## License
[MIT](./LICENSE)
