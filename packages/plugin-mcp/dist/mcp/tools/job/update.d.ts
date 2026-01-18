import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PayloadRequest } from 'payload';
import type { JobConfigUpdate, SchemaField, TaskSequenceItem } from '../../../types.js';
export declare const updateJob: (req: PayloadRequest, verboseLogs: boolean, jobsDir: string, jobSlug: string, updateType: string, inputSchema?: SchemaField[], outputSchema?: SchemaField[], taskSequence?: TaskSequenceItem[], configUpdate?: JobConfigUpdate, handlerCode?: string) => Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare const updateJobTool: (server: McpServer, req: PayloadRequest, verboseLogs: boolean, jobsDir: string) => void;
//# sourceMappingURL=update.d.ts.map