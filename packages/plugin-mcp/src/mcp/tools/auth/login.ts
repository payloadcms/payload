import type { McpServer } from '@modelcontextprotocol/server'
import type { PayloadRequest } from 'payload'

import { getLogger } from '../../../utils/getLogger.js'
import { zodToInputSchema } from '../../helpers/zodToInputSchema.js'
import { toolSchemas } from '../schemas.js'

export const loginTool = (server: McpServer, req: PayloadRequest) => {
  const tool = async (
    collection: string,
    email: string,
    password: string,
    depth: number = 0,
    overrideAccess: boolean = false,
    showHiddenFields: boolean = false,
  ) => {
    const payload = req.payload
    const logger = getLogger({ payload })

    logger.info(`Attempting login for user: ${email} in collection: ${collection}`)

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

      logger.info(`Login successful for user: ${email}`)

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
      logger.error(`Login failed for user ${email}: ${errorMessage}`)

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
      inputSchema: zodToInputSchema(toolSchemas.login.parameters),
    },
    async ({ collection, depth, email, overrideAccess, password, showHiddenFields }: any) => {
      return await tool(collection, email, password, depth, overrideAccess, showHiddenFields)
    },
  )
}
