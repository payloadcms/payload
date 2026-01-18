import { toolSchemas } from '../schemas.js';
export const resetPasswordTool = (server, req, verboseLogs)=>{
    const tool = async (collection, token, password)=>{
        const payload = req.payload;
        if (verboseLogs) {
            payload.logger.info(`[payload-mcp] Resetting password for user in collection: ${collection}`);
        }
        try {
            const result = await payload.resetPassword({
                collection,
                data: {
                    password,
                    token
                },
                overrideAccess: true
            });
            if (verboseLogs) {
                payload.logger.info('[payload-mcp] Password reset completed successfully');
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: `# Password Reset Successful\n\n**Collection:** ${collection}\n**Token:** ${token}\n\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``
                    }
                ]
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            payload.logger.error(`[payload-mcp] Error resetting password: ${errorMessage}`);
            return {
                content: [
                    {
                        type: 'text',
                        text: `❌ **Error resetting password**: ${errorMessage}`
                    }
                ]
            };
        }
    };
    server.tool('resetPassword', toolSchemas.resetPassword.description, toolSchemas.resetPassword.parameters.shape, async ({ collection, password, token })=>{
        return await tool(collection, token, password);
    });
};

//# sourceMappingURL=resetPassword.js.map