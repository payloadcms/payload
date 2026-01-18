import type { IncomingAuthType, LoginWithUsernameOptions } from '../../auth/types.js';
import type { CollectionConfig } from './types.js';
/**
 * @deprecated - remove in 4.0. This is error-prone, as mutating this object will affect any objects that use the defaults as a base.
 */
export declare const defaults: Partial<CollectionConfig>;
export declare const addDefaultsToCollectionConfig: (collection: CollectionConfig) => CollectionConfig;
/**
 * @deprecated - remove in 4.0. This is error-prone, as mutating this object will affect any objects that use the defaults as a base.
 */
export declare const authDefaults: IncomingAuthType;
export declare const addDefaultsToAuthConfig: (auth: IncomingAuthType) => IncomingAuthType;
/**
 * @deprecated - remove in 4.0. This is error-prone, as mutating this object will affect any objects that use the defaults as a base.
 */
export declare const loginWithUsernameDefaults: LoginWithUsernameOptions;
export declare const addDefaultsToLoginWithUsernameConfig: (loginWithUsername: LoginWithUsernameOptions) => LoginWithUsernameOptions;
//# sourceMappingURL=defaults.d.ts.map