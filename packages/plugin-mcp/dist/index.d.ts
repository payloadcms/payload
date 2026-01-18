import type { Config } from 'payload';
import type { MCPAccessSettings, PluginMCPServerConfig } from './types.js';
declare module 'payload' {
    interface PayloadRequest {
        payloadAPI: 'GraphQL' | 'local' | 'MCP' | 'REST';
    }
}
export type { MCPAccessSettings };
/**
 * The MCP Plugin for Payload. This plugin allows you to add MCP capabilities to your Payload project.
 *
 * @param pluginOptions - The options for the MCP plugin.
 * @experimental This plugin is experimental and may change in the future.
 */
export declare const mcpPlugin: (pluginOptions: PluginMCPServerConfig) => (config: Config) => Config;
//# sourceMappingURL=index.d.ts.map