import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PayloadRequest } from 'payload';
export declare const readCollections: (req: PayloadRequest, verboseLogs: boolean, collectionsDirPath: string, collectionName?: string, includeContent?: boolean, includeCount?: boolean) => {
    content: {
        type: "text";
        text: string;
    }[];
};
export declare const findCollectionTool: (server: McpServer, req: PayloadRequest, verboseLogs: boolean, collectionsDirPath: string) => void;
//# sourceMappingURL=find.d.ts.map