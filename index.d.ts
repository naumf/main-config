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
  readonly?: 'proxy' | 'freeze' | false | true;
  schema?: JSONSchemaType<JSONSchemaType<object>>;
  path?: string,
  noWarnings?: boolean,
  env?: EnvOptions;
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

interface WatchErrorListener {
  (err: Error): void
}

interface UnwatchError {
  (): void
}

interface MainConfig {
  config(): object,
  watchConfig?(propertyPath: string, listener: WatchConfigSinglePropertyListener): UnwatchConfig
  watchConfig?(propertyPath: '*', listener: WatchConfigAllPropertiesListener): UnwatchConfig
  watchError?(listener: WatchErrorListener): UnwatchError,
  unwatchFile(): void
}

declare function MainConfig(params?: Params): MainConfig;

export = MainConfig;
