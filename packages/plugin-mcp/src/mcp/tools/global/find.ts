import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { PayloadRequest, PopulateType, SelectType, TypedUser } from 'payload'

import type { MCPPluginConfig } from '../../../types.js'

import { toCamelCase } from '../../../utils/camelCase.js'
import { toolSchemas } from '../schemas.js'

export const findGlobalTool = (
  server: McpServer,
  req: PayloadRequest,
  user: TypedUser,
  verboseLogs: boolean,
  globalSlug: string,
  globals: MCPPluginConfig['globals'],
) => {
  const tool = async (
    depth: number = 0,
    locale?: string,
    fallbackLocale?: string,
    select?: Record<string, unknown>,
    populate?: Record<string, unknown>,
  ): Promise<{
    content: Array<{
      text: string
      type: 'text'
    }>
  }> => {
    const payload = req.payload

    if (verboseLogs) {
      payload.logger.info(
        `[payload-mcp] Reading global: ${globalSlug}, depth: ${depth}${locale ? `, locale: ${locale}` : ''}`,
      )
    }

    try {
      const findOptions: Parameters<typeof payload.findGlobal>[0] = {
        slug: globalSlug,
        depth,
        overrideAccess: false,
        req,
        user,
      }

      // Add locale parameters if provided
      if (locale) {
        findOptions.locale = locale
      }
      if (fallbackLocale) {
        findOptions.fallbackLocale = fallbackLocale
      }
      if (select) {
        findOptions.select = select as SelectType
      }
      if (populate) {
        findOptions.populate = populate as PopulateType
      }

      const result = await payload.findGlobal(findOptions)

      if (verboseLogs) {
        payload.logger.info(`[payload-mcp] Found global: ${globalSlug}`)
      }

      const response = {
        content: [
          {
            type: 'text' as const,
            text: `Global "${globalSlug}":
\`\`\`json
${JSON.stringify(result)}
\`\`\``,
          },
        ],
      }

      return (globals?.[globalSlug]?.overrideResponse?.(response, result, req) || response) as {
        content: Array<{
          text: string
          type: 'text'
        }>
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      payload.logger.error(`[payload-mcp] Error reading global ${globalSlug}: ${errorMessage}`)
      const response = {
        content: [
          {
            type: 'text' as const,
            text: `❌ **Error reading global "${globalSlug}":** ${errorMessage}`,
          },
        ],
      }
      return (globals?.[globalSlug]?.overrideResponse?.(response, {}, req) || response) as {
        content: Array<{
          text: string
          type: 'text'
        }>
      }
    }
  }

  if (globals?.[globalSlug]?.enabled) {
    server.registerTool(
      `find${globalSlug.charAt(0).toUpperCase() + toCamelCase(globalSlug).slice(1)}`,
      {
        description: `${toolSchemas.findGlobal.description.trim()}\n\n${globals?.[globalSlug]?.description || ''}`,
        inputSchema: toolSchemas.findGlobal.parameters.shape,
      },
      async ({ depth, fallbackLocale, locale, populate, select }) => {
        return await tool(depth, locale, fallbackLocale, select, populate)
      },
    )
  }
}
