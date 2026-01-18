import { toolSchemas } from '../schemas.js';
export const verifyTool = (server, req, verboseLogs)=>{
    const tool = async (collection, token)=>{
        const payload = req.payload;
        if (verboseLogs) {
            payload.logger.info(`[payload-mcp] Verifying user account for collection: ${collection}`);
        }
        try {
            const result = await payload.verifyEmail({
                collection,
                token
            });
            if (verboseLogs) {
                payload.logger.info('[payload-mcp] Email verification completed successfully');
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: `# Email Verification Successful\n\n**Collection:** ${collection}\n**Token:** ${token}\n**Result:** ${result ? 'Success' : 'Failed'}`
                    }
                ]
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            payload.logger.error(`[payload-mcp] Error verifying email: ${errorMessage}`);
            return {
                content: [
                    {
                        type: 'text',
                        text: `❌ **Error verifying email**: ${errorMessage}`
                    }
                ]
            };
        }
    };
    server.tool('verify', toolSchemas.verify.description, toolSchemas.verify.parameters.shape, async ({ collection, token })=>{
        return await tool(collection, token);
    });
};

//# sourceMappingURL=verify.js.map