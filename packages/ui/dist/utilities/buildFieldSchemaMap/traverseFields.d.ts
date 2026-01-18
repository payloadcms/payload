import type { I18n } from '@payloadcms/translations';
import type { Field, FieldSchemaMap, SanitizedConfig, TabAsField } from 'payload';
type Args = {
    config: SanitizedConfig;
    fields: (Field | TabAsField)[];
    i18n: I18n<any, any>;
    parentIndexPath: string;
    parentSchemaPath: string;
    schemaMap: FieldSchemaMap;
};
export declare const traverseFields: ({ config, fields, i18n, parentIndexPath, parentSchemaPath, schemaMap, }: Args) => void;
export {};
//# sourceMappingURL=traverseFields.d.ts.map