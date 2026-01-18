import { toolSchemas } from '../schemas.js';
export const forgotPasswordTool = (server, req, verboseLogs)=>{
    const tool = async (collection, email, disableEmail = false)=>{
        const payload = req.payload;
        if (verboseLogs) {
            payload.logger.info(`[payload-mcp] Sending password reset email for user: ${email} in collection: ${collection}`);
        }
        try {
            const result = await payload.forgotPassword({
                collection,
                data: {
                    email
                },
                disableEmail
            });
            if (verboseLogs) {
                payload.logger.info(`[payload-mcp] Password reset email sent successfully for user: ${email}`);
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: `# Password Reset Email Sent\n\n**User:** ${email}\n**Collection:** ${collection}\n**Email Disabled:** ${disableEmail}\n\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``
                    }
                ]
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            payload.logger.error(`[payload-mcp] Error sending password reset email for user ${email}: ${errorMessage}`);
            return {
                content: [
                    {
                        type: 'text',
                        text: `❌ **Error sending password reset email for user "${email}"**: ${errorMessage}`
                    }
                ]
            };
        }
    };
    server.tool('forgotPassword', toolSchemas.forgotPassword.description, toolSchemas.forgotPassword.parameters.shape, async ({ collection, disableEmail, email })=>{
        return await tool(collection, email, disableEmail);
    });
};

//# sourceMappingURL=forgotPassword.js.map