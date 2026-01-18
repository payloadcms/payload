import type { CollectionConfig } from '../collections/config/types.js';
import type { GlobalConfig } from '../globals/config/types.js';
import type { Autosave, SanitizedDrafts } from '../versions/types.js';
type EntityConfig = Pick<CollectionConfig | GlobalConfig, 'versions'>;
/**
 * Check if an entity has drafts enabled
 */
export declare const hasDraftsEnabled: (config: EntityConfig) => boolean;
/**
 * Check if an entity has autosave enabled
 */
export declare const hasAutosaveEnabled: (config: EntityConfig) => config is {
    versions: {
        drafts: {
            autosave: Autosave | false;
        };
    };
} & EntityConfig;
/**
 * Check if an entity has validate drafts enabled
 */
export declare const hasDraftValidationEnabled: (config: EntityConfig) => boolean;
export declare const hasScheduledPublishEnabled: (config: EntityConfig) => config is {
    versions: {
        drafts: {
            schedulePublish: SanitizedDrafts["schedulePublish"];
        };
    };
} & EntityConfig;
/**
 * Get the maximum number of versions to keep for an entity
 * Returns maxPerDoc for collections or max for globals
 */
export declare const getVersionsMax: (config: EntityConfig) => number;
export declare const getAutosaveInterval: (config: EntityConfig) => number;
export {};
//# sourceMappingURL=getVersionsConfig.d.ts.map