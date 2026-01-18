import { toolSchemas } from '../schemas.js';
export const authTool = (server, req, verboseLogs)=>{
    const tool = async (headers)=>{
        const payload = req.payload;
        if (verboseLogs) {
            payload.logger.info('[payload-mcp] Checking authentication status');
        }
        try {
            // Parse custom headers if provided, otherwise use empty headers
            let authHeaders = new Headers();
            if (headers) {
                try {
                    const parsedHeaders = JSON.parse(headers);
                    authHeaders = new Headers(parsedHeaders);
                    if (verboseLogs) {
                        payload.logger.info(`[payload-mcp] Using custom headers: ${headers}`);
                    }
                } catch (_ignore) {
                    payload.logger.warn(`[payload-mcp] Invalid headers JSON: ${headers}, using empty headers`);
                }
            }
            const result = await payload.auth({
                headers: authHeaders
            });
            if (verboseLogs) {
                payload.logger.info('[payload-mcp] Authentication check completed successfully');
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: `# Authentication Status\n\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``
                    }
                ]
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            payload.logger.error(`[payload-mcp] Error checking authentication: ${errorMessage}`);
            return {
                content: [
                    {
                        type: 'text',
                        text: `❌ **Error checking authentication**: ${errorMessage}`
                    }
                ]
            };
        }
    };
    server.tool('auth', toolSchemas.auth.description, toolSchemas.auth.parameters.shape, async ({ headers })=>{
        return await tool(headers);
    });
};

//# sourceMappingURL=auth.js.map