import type { Config, SanitizedConfig } from '../../config/types.js';
import type { CollectionConfig, SanitizedCollectionConfig } from './types.js';
export declare const sanitizeCollection: (config: Config, collection: CollectionConfig, richTextSanitizationPromises?: Array<(config: SanitizedConfig) => Promise<void>>, _validRelationships?: string[]) => Promise<SanitizedCollectionConfig>;
//# sourceMappingURL=sanitize.d.ts.map