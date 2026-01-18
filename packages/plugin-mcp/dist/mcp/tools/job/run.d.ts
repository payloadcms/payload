import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PayloadRequest } from 'payload';
export declare const runJob: (req: PayloadRequest, verboseLogs: boolean, jobSlug: string, input: Record<string, any>, queue?: string, priority?: number, delay?: number) => Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare const runJobTool: (server: McpServer, req: PayloadRequest, verboseLogs: boolean) => void;
//# sourceMappingURL=run.d.ts.map