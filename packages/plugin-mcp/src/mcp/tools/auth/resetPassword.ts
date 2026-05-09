import type { McpServer } from '@modelcontextprotocol/server'
import type { PayloadRequest } from 'payload'

import { getLogger } from '../../../utils/getLogger.js'
import { zodToInputSchema } from '../../helpers/zodToInputSchema.js'
import { toolSchemas } from '../schemas.js'

export const resetPasswordTool = (server: McpServer, req: PayloadRequest) => {
  const tool = async (collection: string, token: string, password: string) => {
    const payload = req.payload
    const logger = getLogger({ payload })

    logger.info(`Resetting password for user in collection: ${collection}`)

    try {
      const result = await payload.resetPassword({
        collection,
        data: {
          password,
          token,
        },
        overrideAccess: true,
      })

      logger.info('Password reset completed successfully')

      return {
        content: [
          {
            type: 'text' as const,
            text: `# Password Reset Successful\n\n**Collection:** ${collection}\n**Token:** ${token}\n\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
          },
        ],
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`Error resetting password: ${errorMessage}`)

      return {
        content: [
          {
            type: 'text' as const,
            text: `❌ **Error resetting password**: ${errorMessage}`,
          },
        ],
      }
    }
  }

  server.registerTool(
    'resetPassword',
    {
      description: toolSchemas.resetPassword.description,
      inputSchema: zodToInputSchema(toolSchemas.resetPassword.parameters),
    },
    async ({ collection, password, token }: any) => {
      return await tool(collection, token, password)
    },
  )
}
