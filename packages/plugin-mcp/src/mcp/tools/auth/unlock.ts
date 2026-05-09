import type { McpServer } from '@modelcontextprotocol/server'
import type { PayloadRequest } from 'payload'

import { getLogger } from '../../../utils/getLogger.js'
import { zodToInputSchema } from '../../helpers/zodToInputSchema.js'
import { toolSchemas } from '../schemas.js'

export const unlockTool = (server: McpServer, req: PayloadRequest) => {
  const tool = async (collection: string, email: string) => {
    const payload = req.payload
    const logger = getLogger({ payload })

    logger.info(`Unlocking user account for user: ${email} in collection: ${collection}`)

    try {
      const result = await payload.unlock({
        collection,
        data: {
          email,
        },
        overrideAccess: true,
      })

      logger.info(`User account unlocked successfully for user: ${email}`)

      return {
        content: [
          {
            type: 'text' as const,
            text: `# User Account Unlocked\n\n**User:** ${email}\n**Collection:** ${collection}\n\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
          },
        ],
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`Error unlocking user account for user ${email}: ${errorMessage}`)

      return {
        content: [
          {
            type: 'text' as const,
            text: `❌ **Error unlocking user account for user "${email}"**: ${errorMessage}`,
          },
        ],
      }
    }
  }

  server.registerTool(
    'unlock',
    {
      description: toolSchemas.unlock.description,
      inputSchema: zodToInputSchema(toolSchemas.unlock.parameters),
    },
    async ({ collection, email }: any) => {
      return await tool(collection, email)
    },
  )
}
