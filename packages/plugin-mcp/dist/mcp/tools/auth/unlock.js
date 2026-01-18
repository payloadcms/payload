import { toolSchemas } from '../schemas.js';
export const unlockTool = (server, req, verboseLogs)=>{
    const tool = async (collection, email)=>{
        const payload = req.payload;
        if (verboseLogs) {
            payload.logger.info(`[payload-mcp] Unlocking user account for user: ${email} in collection: ${collection}`);
        }
        try {
            const result = await payload.unlock({
                collection,
                data: {
                    email
                },
                overrideAccess: true
            });
            if (verboseLogs) {
                payload.logger.info(`[payload-mcp] User account unlocked successfully for user: ${email}`);
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: `# User Account Unlocked\n\n**User:** ${email}\n**Collection:** ${collection}\n\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``
                    }
                ]
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            payload.logger.error(`[payload-mcp] Error unlocking user account for user ${email}: ${errorMessage}`);
            return {
                content: [
                    {
                        type: 'text',
                        text: `❌ **Error unlocking user account for user "${email}"**: ${errorMessage}`
                    }
                ]
            };
        }
    };
    server.tool('unlock', toolSchemas.unlock.description, toolSchemas.unlock.parameters.shape, async ({ collection, email })=>{
        return await tool(collection, email);
    });
};

//# sourceMappingURL=unlock.js.map