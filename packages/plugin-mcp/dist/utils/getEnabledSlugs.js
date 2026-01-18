import { adminEntitySettings } from './adminEntitySettings.js';
/**
 * Extracts enabled slugs from collections or globals configuration.
 * A slug is considered enabled if:
 * 1. enabled is set to true (fully enabled)
 * 2. enabled is an object with at least one operation set to true
 *
 * @param config - The collections or globals configuration object
 * @param configType - The type of configuration ('collection' or 'global')
 * @returns Array of enabled slugs
 */ export const getEnabledSlugs = (config, configType)=>{
    return Object.keys(config || {}).filter((slug)=>{
        const entityConfig = config?.[slug];
        const operations = adminEntitySettings[configType];
        // Check if fully enabled (boolean true)
        const fullyEnabled = typeof entityConfig?.enabled === 'boolean' && entityConfig?.enabled === true;
        if (fullyEnabled) {
            return true;
        }
        // Check if partially enabled (at least one operation is enabled)
        const enabled = entityConfig?.enabled;
        if (typeof enabled !== 'boolean' && enabled) {
            return operations.some((operation)=>{
                const operationEnabled = enabled[operation.name];
                return typeof operationEnabled === 'boolean' && operationEnabled === true;
            });
        }
        return false;
    });
};

//# sourceMappingURL=getEnabledSlugs.js.map