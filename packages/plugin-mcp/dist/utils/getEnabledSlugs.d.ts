import type { EntityConfig } from '../types.js';
/**
 * Extracts enabled slugs from collections or globals configuration.
 * A slug is considered enabled if:
 * 1. enabled is set to true (fully enabled)
 * 2. enabled is an object with at least one operation set to true
 *
 * @param config - The collections or globals configuration object
 * @param configType - The type of configuration ('collection' or 'global')
 * @returns Array of enabled slugs
 */
export declare const getEnabledSlugs: (config: EntityConfig | undefined, configType: "collection" | "global") => string[];
//# sourceMappingURL=getEnabledSlugs.d.ts.map