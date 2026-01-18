import type { I18nClient } from '@payloadcms/translations';
import type { ClientConfig, ClientFieldSchemaMap, FieldSchemaMap, Payload } from 'payload';
export declare const getClientSchemaMap: (args: {
    collectionSlug?: string;
    config: ClientConfig;
    globalSlug?: string;
    i18n: I18nClient;
    payload: Payload;
    schemaMap: FieldSchemaMap;
}) => ClientFieldSchemaMap;
//# sourceMappingURL=getClientSchemaMap.d.ts.map