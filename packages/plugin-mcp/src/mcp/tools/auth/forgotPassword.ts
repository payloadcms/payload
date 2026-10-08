import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { PayloadRequest } from 'payload'

import { toolSchemas } from '../schemas.js'

export const forgotPasswordTool = (
  server: McpServer,
  req: PayloadRequest,
  verboseLogs: boolean,
) => {
  const tool = async (collection: string, email: string) => {
    const payload = req.payload

    if (verboseLogs) {
      payload.logger.info(
        `[payload-mcp] Sending password reset email for user: ${email} in collection: ${collection}`,
      )
    }

    try {
      await payload.forgotPassword({
        collection,
        data: {
          email,
        },
        disableEmail: false,
        overrideAccess: false,
        req,
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
            text: 'If an account matches that email, password reset instructions have been sent.',
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
    async ({ collection, email }) => {
      return await tool(collection, email)
    },
  )
}
