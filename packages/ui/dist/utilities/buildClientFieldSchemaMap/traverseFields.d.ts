import type { I18n } from '@payloadcms/translations';
import type { ClientConfig, ClientField, ClientFieldSchemaMap, FieldSchemaMap, Payload, TabAsFieldClient } from 'payload';
type Args = {
    clientSchemaMap: ClientFieldSchemaMap;
    config: ClientConfig;
    fields: (ClientField | TabAsFieldClient)[];
    i18n: I18n<any, any>;
    parentIndexPath: string;
    parentSchemaPath: string;
    payload: Payload;
    schemaMap: FieldSchemaMap;
};
export declare const traverseFields: ({ clientSchemaMap, config, fields, i18n, parentIndexPath, parentSchemaPath, payload, schemaMap, }: Args) => void;
export {};
//# sourceMappingURL=traverseFields.d.ts.map