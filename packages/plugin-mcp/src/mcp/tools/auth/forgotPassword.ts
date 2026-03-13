import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { PayloadRequest } from 'payload'

import { toolSchemas } from '../schemas.js'

export const forgotPasswordTool = (
  server: McpServer,
  req: PayloadRequest,
  verboseLogs: boolean,
) => {
  const tool = async (collection: string, email: string, disableEmail: boolean = false) => {
    const payload = req.payload

    if (verboseLogs) {
      payload.logger.info(
        `[payload-mcp] Sending password reset email for user: ${email} in collection: ${collection}`,
      )
    }

    try {
      const result = await payload.forgotPassword({
        collection,
        data: {
          email,
        },
        disableEmail,
      })

      if (verboseLogs) {
        payload.logger.info(
          `[payload-mcp] Password reset email sent successfully for user: ${email}`,
        )
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: `# Password Reset Email Sent\n\n**User:** ${email}\n**Collection:** ${collection}\n**Email Disabled:** ${disableEmail}\n\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
          },
        ],
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      payload.logger.error(
        `[payload-mcp] Error sending password reset email for user ${email}: ${errorMessage}`,
      )

      return {
        content: [
          {
            type: 'text' as const,
            text: `❌ **Error sending password reset email for user "${email}"**: ${errorMessage}`,
          },
        ],
      }
    }
  }

  server.registerTool(
    'forgotPassword',
    {
      description: toolSchemas.forgotPassword.description,
      inputSchema: toolSchemas.forgotPassword.parameters.shape,
    },
    async ({ collection, disableEmail, email }) => {
      return await tool(collection, email, disableEmail)
    },
  )
}
