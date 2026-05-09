import type { McpServer } from '@modelcontextprotocol/server'
import type { PayloadRequest } from 'payload'

import { getLogger } from '../../../utils/getLogger.js'
import { zodToInputSchema } from '../../helpers/zodToInputSchema.js'
import { toolSchemas } from '../schemas.js'

export const authTool = (server: McpServer, req: PayloadRequest) => {
  const tool = async (headers?: string) => {
    const payload = req.payload
    const logger = getLogger({ payload })

    logger.info('Checking authentication status')

    try {
      // Parse custom headers if provided, otherwise use empty headers
      let authHeaders = new Headers()

      if (headers) {
        try {
          const parsedHeaders = JSON.parse(headers)
          authHeaders = new Headers(parsedHeaders)
          logger.info(`Using custom headers: ${headers}`)
        } catch (_ignore) {
          logger.warn(`Invalid headers JSON: ${headers}, using empty headers`)
        }
      }

      const result = await payload.auth({
        headers: authHeaders,
      })

      logger.info('Authentication check completed successfully')

      return {
        content: [
          {
            type: 'text' as const,
            text: `# Authentication Status\n\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
          },
        ],
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`Error checking authentication: ${errorMessage}`)

      return {
        content: [
          {
            type: 'text' as const,
            text: `❌ **Error checking authentication**: ${errorMessage}`,
          },
        ],
      }
    }
  }

  server.registerTool(
    'auth',
    {
      description: toolSchemas.auth.description,
      inputSchema: zodToInputSchema(toolSchemas.auth.parameters),
    },
    async ({ headers }: any) => {
      return await tool(headers)
    },
  )
}
