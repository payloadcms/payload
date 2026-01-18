import { adminEntitySettings } from './adminEntitySettings.js';
import { toCamelCase } from './camelCase.js';
import { getEnabledSlugs } from './getEnabledSlugs.js';
/**
 * Creates MCP API key permission fields using collections or globals.
 * Generates collapsible field groups with checkboxes for each enabled operation.
 *
 * @param config - The collections or globals configuration object
 * @param configType - The type of configuration ('collection' or 'global')
 * @returns Array of fields for the MCP API Keys collection
 */ export const createApiKeyFields = ({ config, configType })=>{
    const operations = adminEntitySettings[configType];
    const enabledSlugs = getEnabledSlugs(config, configType);
    return enabledSlugs.map((slug)=>{
        const entityConfig = config?.[slug];
        const enabledOperations = operations.filter((operation)=>{
            // If fully enabled, all operations are available
            if (entityConfig?.enabled === true) {
                return true;
            }
            // If partially enabled, check if this specific operation is enabled
            const enabled = entityConfig?.enabled;
            if (typeof enabled !== 'boolean' && enabled) {
                const operationEnabled = enabled[operation.name];
                return typeof operationEnabled === 'boolean' && operationEnabled === true;
            }
            return false;
        });
        // Generate checkbox fields for each enabled operation
        const operationFields = enabledOperations.map((operation)=>({
                name: operation.name,
                type: 'checkbox',
                admin: {
                    description: operation.description(slug)
                },
                defaultValue: false,
                label: operation.label
            }));
        return {
            type: 'collapsible',
            admin: {
                position: 'sidebar'
            },
            fields: [
                {
                    name: toCamelCase(slug),
                    type: 'group',
                    fields: operationFields,
                    label: configType
                }
            ],
            label: `${slug.charAt(0).toUpperCase() + toCamelCase(slug).slice(1)}`
        };
    });
};

//# sourceMappingURL=createApiKeyFields.js.map