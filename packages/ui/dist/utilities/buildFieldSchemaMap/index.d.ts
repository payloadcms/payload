import type { I18n } from '@payloadcms/translations';
import type { FieldSchemaMap, SanitizedConfig } from 'payload';
/**
 * Flattens the config fields into a map of field schemas
 */
export declare const buildFieldSchemaMap: (args: {
    collectionSlug?: string;
    config: SanitizedConfig;
    globalSlug?: string;
    i18n: I18n;
}) => {
    fieldSchemaMap: FieldSchemaMap;
};
//# sourceMappingURL=index.d.ts.map