import type { ClientCollectionConfig, SanitizedCollectionConfig, SelectType } from '../index.js';
/**
 * Mutates the incoming select object to append fields required for upload thumbnails
 * @param collectionConfig
 * @param select
 */
export declare const appendUploadSelectFields: ({ collectionConfig, select, }: {
    collectionConfig: ClientCollectionConfig | SanitizedCollectionConfig;
    select: SelectType;
}) => void;
//# sourceMappingURL=appendUploadSelectFields.d.ts.map