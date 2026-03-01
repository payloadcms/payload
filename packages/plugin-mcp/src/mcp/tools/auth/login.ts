import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { PayloadRequest } from 'payload'

import { toolSchemas } from '../schemas.js'

export const loginTool = (server: McpServer, req: PayloadRequest, verboseLogs: boolean) => {
  const tool = async (
    collection: string,
    email: string,
    password: string,
    depth: number = 0,
    overrideAccess: boolean = false,
    showHiddenFields: boolean = false,
  ) => {
    const payload = req.payload

    if (verboseLogs) {
      payload.logger.info(
        `[payload-mcp] Attempting login for user: ${email} in collection: ${collection}`,
      )
    }

    try {
      const result = await payload.login({
        collection,
        data: {
          email,
          password,
        },
        depth,
        overrideAccess,
        showHiddenFields,
      })

      if (verboseLogs) {
        payload.logger.info(`[payload-mcp] Login successful for user: ${email}`)
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: `# Login Successful\n\n**User:** ${email}\n**Collection:** ${collection}\n\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
          },
        ],
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      payload.logger.error(`[payload-mcp] Login failed for user ${email}: ${errorMessage}`)

      return {
        content: [
          {
            type: 'text' as const,
            text: `❌ **Login failed for user "${email}"**: ${errorMessage}`,
          },
        ],
      }
    }
  }

  server.registerTool(
    'login',
    {
      description: toolSchemas.login.description,
      inputSchema: toolSchemas.login.parameters.shape,
    },
    async ({ collection, depth, email, overrideAccess, password, showHiddenFields }) => {
      return await tool(collection, email, password, depth, overrideAccess, showHiddenFields)
    },
  )
}
