import type { Field } from 'payload';
import type { EntityConfig } from '../types.js';
/**
 * Creates MCP API key permission fields using collections or globals.
 * Generates collapsible field groups with checkboxes for each enabled operation.
 *
 * @param config - The collections or globals configuration object
 * @param configType - The type of configuration ('collection' or 'global')
 * @returns Array of fields for the MCP API Keys collection
 */
export declare const createApiKeyFields: ({ config, configType, }: {
    config: EntityConfig | undefined;
    configType: "collection" | "global";
}) => Field[];
//# sourceMappingURL=createApiKeyFields.d.ts.map