import Ajv, { JSONSchemaType} from 'ajv'

interface EnvOptions {
  path?: string;
  watch?: boolean;
  schema?: JSONSchemaType<JSONSchemaType<object>>;
  overridable: Array<string>;
  notOverridableOnWatch: Array<string>;
}

interface Params {
  ajv?: Ajv,
  environments?: Array<string>;
  readonly?: boolean;
  schema?: JSONSchemaType<JSONSchemaType<object>>;
  path?: string,
  noWarnings?: boolean,
  env?: EnvOptions;
}

interface Config {
  (): object
}

interface Changes {
  path: string;
  newValue: any;
  oldValue: any;
}

interface WatchConfigSinglePropertyListener {
  (newValue: any, oldValue: any): void
}

interface WatchConfigAllPropertiesListener {
  (changes: Array<Changes>): void
}

interface UnwatchConfig {
  (): void
}

interface WatchConfig {
  (propertyPath: string, listener: WatchConfigSinglePropertyListener): UnwatchConfig
  (propertyPath: '*', listener: WatchConfigAllPropertiesListener): UnwatchConfig
}

interface WatchErrorListener {
  (err: Error): void
}

interface UnwatchError {
  (): void
}

interface WatchError {
  (listener: WatchErrorListener): UnwatchError
}

interface UnwatchFile {
  (): void
}

interface MainConfig {
  config: Config,
  watchConfig?: WatchConfig,
  watchError?: WatchError,
  unwatchFile: UnwatchFile
}

declare function MainConfig(params?: Params): MainConfig;

export = MainConfig;
