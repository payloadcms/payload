import type { CollectionSlug, Field, FieldAffectingData, SanitizedConfig } from 'payload';
/**
 * This function is run to enrich the basefields which every link has with potential, custom user-added fields.
 */
export declare function transformExtraFields(customFieldSchema: ((args: {
    config: SanitizedConfig;
    defaultFields: FieldAffectingData[];
}) => (Field | FieldAffectingData)[]) | Field[] | null, config: SanitizedConfig, enabledCollections?: CollectionSlug[], disabledCollections?: CollectionSlug[], maxDepth?: number): Field[];
//# sourceMappingURL=transformExtraFields.d.ts.map