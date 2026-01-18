import type { I18n } from '@payloadcms/translations';
import type { JSONSchema4, JSONSchema4TypeName } from 'json-schema';
import type { SanitizedCollectionConfig } from '../collections/config/types.js';
import type { SanitizedConfig } from '../config/types.js';
import type { FlattenedField } from '../fields/config/types.js';
import type { SanitizedGlobalConfig } from '../globals/config/types.js';
/**
 * Returns a JSON Schema Type with 'null' added if the field is not required.
 */
export declare function withNullableJSONSchemaType(fieldType: JSONSchema4TypeName, isRequired: boolean): JSONSchema4TypeName | JSONSchema4TypeName[];
export declare function fieldsToJSONSchema(
/**
 * Used for relationship fields, to determine whether to use a string or number type for the ID.
 * While there is a default ID field type set by the db adapter, they can differ on a collection-level
 * if they have custom ID fields.
 */
collectionIDFieldTypes: {
    [key: string]: 'number' | 'string';
}, fields: FlattenedField[], 
/**
 * Allows you to define new top-level interfaces that can be re-used in the output schema.
 */
interfaceNameDefinitions: Map<string, JSONSchema4>, config?: SanitizedConfig, i18n?: I18n): {
    properties: {
        [k: string]: JSONSchema4;
    };
    required: string[];
};
export declare function entityToJSONSchema(config: SanitizedConfig, entity: SanitizedCollectionConfig | SanitizedGlobalConfig, interfaceNameDefinitions: Map<string, JSONSchema4>, defaultIDType: 'number' | 'text', collectionIDFieldTypes?: {
    [key: string]: 'number' | 'string';
}, i18n?: I18n): JSONSchema4;
export declare function fieldsToSelectJSONSchema({ config, fields, interfaceNameDefinitions, }: {
    config: SanitizedConfig;
    fields: FlattenedField[];
    interfaceNameDefinitions: Map<string, JSONSchema4>;
}): JSONSchema4;
export declare function authCollectionToOperationsJSONSchema(config: SanitizedCollectionConfig): JSONSchema4;
export declare function timezonesToJSONSchema(supportedTimezones: SanitizedConfig['admin']['timezones']['supportedTimezones']): JSONSchema4;
/**
 * This is used for generating the TypeScript types (payload-types.ts) with the payload generate:types command.
 */
export declare function configToJSONSchema(config: SanitizedConfig, defaultIDType?: 'number' | 'text', i18n?: I18n): JSONSchema4;
//# sourceMappingURL=configToJSONSchema.d.ts.map