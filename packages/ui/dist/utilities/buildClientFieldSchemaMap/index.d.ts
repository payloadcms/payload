import type { I18n } from '@payloadcms/translations';
import type { ClientConfig, ClientFieldSchemaMap, FieldSchemaMap, Payload } from 'payload';
/**
 * Flattens the config fields into a map of field schemas
 */
export declare const buildClientFieldSchemaMap: (args: {
    collectionSlug?: string;
    config: ClientConfig;
    globalSlug?: string;
    i18n: I18n;
    payload: Payload;
    schemaMap: FieldSchemaMap;
}) => {
    clientFieldSchemaMap: ClientFieldSchemaMap;
};
//# sourceMappingURL=index.d.ts.map