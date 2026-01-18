import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PayloadRequest } from 'payload';
export declare const deleteCollection: (req: PayloadRequest, verboseLogs: boolean, collectionsDirPath: string, configFilePath: string, collectionName: string, confirmDeletion: boolean, updateConfig: boolean) => {
    content: {
        type: "text";
        text: string;
    }[];
};
export declare const deleteCollectionTool: (server: McpServer, req: PayloadRequest, verboseLogs: boolean, collectionsDirPath: string, configFilePath: string) => void;
//# sourceMappingURL=delete.d.ts.map