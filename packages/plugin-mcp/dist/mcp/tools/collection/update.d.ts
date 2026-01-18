import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PayloadRequest } from 'payload';
export declare const updateCollection: (req: PayloadRequest, verboseLogs: boolean, collectionsDirPath: string, configFilePath: string, collectionName: string, updateType: string, newFields?: any[], fieldNamesToRemove?: string[], fieldModifications?: any[], configUpdates?: any, newContent?: string) => Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare const updateCollectionTool: (server: McpServer, req: PayloadRequest, verboseLogs: boolean, collectionsDirPath: string, configFilePath: string) => void;
//# sourceMappingURL=update.d.ts.map