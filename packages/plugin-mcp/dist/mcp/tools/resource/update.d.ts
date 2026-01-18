import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { JSONSchema4 } from 'json-schema';
import type { PayloadRequest, TypedUser } from 'payload';
import type { PluginMCPServerConfig } from '../../../types.js';
export declare const updateResourceTool: (server: McpServer, req: PayloadRequest, user: TypedUser, verboseLogs: boolean, collectionSlug: string, collections: PluginMCPServerConfig["collections"], schema: JSONSchema4) => void;
//# sourceMappingURL=update.d.ts.map