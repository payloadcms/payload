import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PayloadRequest } from 'payload';
export declare const readConfigFile: (req: PayloadRequest, verboseLogs: boolean, configFilePath: string, includeMetadata?: boolean) => {
    content: {
        type: "text";
        text: string;
    }[];
};
export declare const findConfigTool: (server: McpServer, req: PayloadRequest, verboseLogs: boolean, configFilePath: string) => void;
//# sourceMappingURL=find.d.ts.map