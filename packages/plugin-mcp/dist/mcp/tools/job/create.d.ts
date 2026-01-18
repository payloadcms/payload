import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PayloadRequest } from 'payload';
export declare const createJob: (req: PayloadRequest, verboseLogs: boolean, jobsDir: string, jobName: string, jobType: "task" | "workflow", jobSlug: string, description: string, inputSchema: any, outputSchema: any, jobData: Record<string, any>) => Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare const createJobTool: (server: McpServer, req: PayloadRequest, verboseLogs: boolean, jobsDir: string) => void;
//# sourceMappingURL=create.d.ts.map