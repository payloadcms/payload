import { type PayloadRequest } from 'payload';
import type { MCPAccessSettings, PluginMCPServerConfig } from '../types.js';
export declare const getMCPHandler: (pluginOptions: PluginMCPServerConfig, mcpAccessSettings: MCPAccessSettings, req: PayloadRequest) => (request: Request) => Promise<Response>;
//# sourceMappingURL=getMcpHandler.d.ts.map