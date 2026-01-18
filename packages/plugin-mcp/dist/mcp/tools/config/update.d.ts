import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PayloadRequest } from 'payload';
export declare const updateConfig: (req: PayloadRequest, verboseLogs: boolean, configFilePath: string, updateType: string, collectionName?: string, adminConfig?: any, databaseConfig?: any, pluginUpdates?: any, generalConfig?: any, newContent?: string) => {
    content: {
        type: "text";
        text: string;
    }[];
};
export declare const updateConfigTool: (server: McpServer, req: PayloadRequest, verboseLogs: boolean, configFilePath: string) => void;
//# sourceMappingURL=update.d.ts.map