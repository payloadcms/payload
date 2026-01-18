import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { PayloadRequest } from '@ruya.sa/payload'

import { toolSchemas } from '../schemas.js'

export const verifyTool = (server: McpServer, req: PayloadRequest, verboseLogs: boolean) => {
  const tool = async (collection: string, token: string) => {
    const payload = req.payload

    if (verboseLogs) {
      payload.logger.info(`[payload-mcp] Verifying user account for collection: ${collection}`)
    }

    try {
      const result = await payload.verifyEmail({
        collection,
        token,
      })

      if (verboseLogs) {
        payload.logger.info('[payload-mcp] Email verification completed successfully')
      }

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
      payload.logger.error(`[payload-mcp] Error verifying email: ${errorMessage}`)

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

  server.tool(
    'verify',
    toolSchemas.verify.description,
    toolSchemas.verify.parameters.shape,
    async ({ collection, token }) => {
      return await tool(collection, token)
    },
  )
}
