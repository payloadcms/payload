import type { McpServer } from '@modelcontextprotocol/server'
import type { PayloadRequest } from 'payload'

import { getLogger } from '../../../utils/getLogger.js'
import { zodToInputSchema } from '../../helpers/zodToInputSchema.js'
import { toolSchemas } from '../schemas.js'

export const verifyTool = (server: McpServer, req: PayloadRequest) => {
  const tool = async (collection: string, token: string) => {
    const payload = req.payload
    const logger = getLogger({ payload })

    logger.info(`Verifying user account for collection: ${collection}`)

    try {
      const result = await payload.verifyEmail({
        collection,
        token,
      })

      logger.info('Email verification completed successfully')

      return {
        content: [
          {
            type: 'text' as const,
            text: `# Email Verification Successful\n\n**Collection:** ${collection}\n**Token:** ${token}\n**Result:** ${result ? 'Success' : 'Failed'}`,
          },
        ],
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`Error verifying email: ${errorMessage}`)

      return {
        content: [
          {
            type: 'text' as const,
            text: `❌ **Error verifying email**: ${errorMessage}`,
          },
        ],
      }
    }
  }

  server.registerTool(
    'verify',
    {
      description: toolSchemas.verify.description,
      inputSchema: zodToInputSchema(toolSchemas.verify.parameters),
    },
    async ({ collection, token }: any) => {
      return await tool(collection, token)
    },
  )
}
