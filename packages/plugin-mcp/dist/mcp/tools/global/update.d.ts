import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { JSONSchema4 } from 'json-schema';
import type { PayloadRequest, TypedUser } from 'payload';
import type { PluginMCPServerConfig } from '../../../types.js';
export declare const updateGlobalTool: (server: McpServer, req: PayloadRequest, user: TypedUser, verboseLogs: boolean, globalSlug: string, globals: PluginMCPServerConfig["globals"], schema: JSONSchema4) => void;
//# sourceMappingURL=update.d.ts.map