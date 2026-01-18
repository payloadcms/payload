import type { Config, SanitizedConfig } from '../config/types.js';
import type { CollectionConfig } from '../index.js';
export declare function addFolderCollection({ collectionSpecific, config, folderEnabledCollections, richTextSanitizationPromises, validRelationships, }: {
    collectionSpecific: boolean;
    config: NonNullable<Config>;
    folderEnabledCollections: CollectionConfig[];
    richTextSanitizationPromises?: Array<(config: SanitizedConfig) => Promise<void>>;
    validRelationships?: string[];
}): Promise<void>;
//# sourceMappingURL=addFolderCollection.d.ts.map