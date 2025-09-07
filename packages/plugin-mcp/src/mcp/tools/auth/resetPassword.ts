import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { PayloadRequest } from 'payload'

import { toolSchemas } from '../schemas.js'

export const resetPasswordTool = (server: McpServer, req: PayloadRequest, verboseLogs: boolean) => {
  const tool = async (collection: string, token: string, password: string) => {
    const payload = req.payload

    if (verboseLogs) {
      payload.logger.info(`[payload-mcp] Resetting password for user in collection: ${collection}`)
    }

    try {
      const result = await payload.resetPassword({
        collection,
        data: {
          password,
          token,
        },
        overrideAccess: true,
      })

      if (verboseLogs) {
        payload.logger.info('[payload-mcp] Password reset completed successfully')
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: `# Password Reset Successful\n\n**Collection:** ${collection}\n**Token:** ${token}\n\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``,
          },
        ],
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      payload.logger.error(`[payload-mcp] Error resetting password: ${errorMessage}`)

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

  server.tool(
    'resetPassword',
    toolSchemas.resetPassword.description,
    toolSchemas.resetPassword.parameters.shape,
    async ({ collection, password, token }) => {
      return await tool(collection, token, password)
    },
  )
}
