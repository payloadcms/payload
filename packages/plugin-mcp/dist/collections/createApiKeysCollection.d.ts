import type { CollectionConfig } from 'payload';
import type { PluginMCPServerConfig } from '../types.js';
export declare const createAPIKeysCollection: (collections: PluginMCPServerConfig["collections"], globals: PluginMCPServerConfig["globals"], customTools: Array<{
    description: string;
    name: string;
}> | undefined, experimentalTools: NonNullable<PluginMCPServerConfig["experimental"]>["tools"] | undefined, pluginOptions: PluginMCPServerConfig) => CollectionConfig;
//# sourceMappingURL=createApiKeysCollection.d.ts.map