import type { Config } from './types.js';
/**
 * @deprecated - remove in 4.0. This is error-prone, as mutating this object will affect any objects that use the defaults as a base.
 */
export declare const defaults: Omit<Config, 'db' | 'editor' | 'secret'>;
export declare const addDefaultsToConfig: (config: Config) => Config;
//# sourceMappingURL=defaults.d.ts.map