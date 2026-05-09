import type { McpServer } from '@modelcontextprotocol/server'
import type { PayloadRequest } from 'payload'

import { getLogger } from '../../../utils/getLogger.js'
import { zodToInputSchema } from '../../helpers/zodToInputSchema.js'
import { toolSchemas } from '../schemas.js'

export const forgotPasswordTool = (server: McpServer, req: PayloadRequest) => {
  const tool = async (collection: string, email: string, disableEmail: boolean = false) => {
    const payload = req.payload
    const logger = getLogger({ payload })

    logger.info(`Sending password reset email for user: ${email} in collection: ${collection}`)

    try {
      const result = await payload.forgotPassword({
        collection,
        data: {
          email,
        },
        disableEmail,
      })

      logger.info(`Password reset email sent successfully for user: ${email}`)

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
      logger.error(`Error sending password reset email for user ${email}: ${errorMessage}`)

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
      inputSchema: zodToInputSchema(toolSchemas.forgotPassword.parameters),
    },
    async ({ collection, disableEmail, email }: any) => {
      return await tool(collection, email, disableEmail)
    },
  )
}
