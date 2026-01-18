import type { I18n } from '@payloadcms/translations';
import type { JSONSchema4 } from 'json-schema';
import type { SanitizedConfig } from '../../config/types.js';
import type { JobsConfig } from './types/index.js';
export declare function generateJobsJSONSchemas(config: SanitizedConfig, jobsConfig: JobsConfig, interfaceNameDefinitions: Map<string, JSONSchema4>, 
/**
 * Used for relationship fields, to determine whether to use a string or number type for the ID.
 * While there is a default ID field type set by the db adapter, they can differ on a collection-level
 * if they have custom ID fields.
 */
collectionIDFieldTypes: {
    [key: string]: 'number' | 'string';
}, i18n?: I18n): {
    definitions?: Map<string, JSONSchema4>;
    properties?: {
        tasks: JSONSchema4;
    };
};
//# sourceMappingURL=generateJobsJSONSchemas.d.ts.map