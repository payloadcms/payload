import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { PayloadRequest } from 'payload'

import { toolSchemas } from '../schemas.js'

export const unlockTool = (server: McpServer, req: PayloadRequest, verboseLogs: boolean) => {
  const tool = async (collection: string, email: string) => {
    const payload = req.payload

    if (verboseLogs) {
      payload.logger.info(
        `[payload-mcp] Unlocking user account for user: ${email} in collection: ${collection}`,
      )
    }

    try {
      const result = await payload.unlock({
        collection,
        data: {
          email,
        },
        overrideAccess: true,
      })

      if (verboseLogs) {
        payload.logger.info(`[payload-mcp] User account unlocked successfully for user: ${email}`)
      }

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
      payload.logger.error(
        `[payload-mcp] Error unlocking user account for user ${email}: ${errorMessage}`,
      )

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

  server.tool(
    'unlock',
    toolSchemas.unlock.description,
    toolSchemas.unlock.parameters.shape,
    async ({ collection, email }) => {
      return await tool(collection, email)
    },
  )
}
