import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PayloadRequest } from 'payload';
export declare const createCollection: (req: PayloadRequest, verboseLogs: boolean, collectionsDirPath: string, configFilePath: string, collectionName: string, collectionDescription: string | undefined, fields: any[], hasUpload: boolean | undefined) => Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare const createCollectionTool: (server: McpServer, req: PayloadRequest, verboseLogs: boolean, collectionsDirPath: string, configFilePath: string) => void;
//# sourceMappingURL=create.d.ts.map