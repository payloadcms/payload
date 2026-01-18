import type { SanitizedConfig } from '../config/types.js';
/**
 *  While the default ID is determined by the db adapter, it can still differ for a collection if they
 *  define a custom ID field. This builds a map of collection slugs to their ID field type.
 * @param defaultIDType as defined by the database adapter
 */
export declare function getCollectionIDFieldTypes({ config, defaultIDType, }: {
    config: SanitizedConfig;
    defaultIDType: 'number' | 'text';
}): {
    [key: string]: 'number' | 'string';
};
//# sourceMappingURL=getCollectionIDFieldTypes.d.ts.map