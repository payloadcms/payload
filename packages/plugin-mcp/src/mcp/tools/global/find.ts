import type { McpServer } from '@modelcontextprotocol/server'
import type { PayloadRequest, SelectType, TypedUser } from 'payload'

import type { MCPPluginConfig } from '../../../types.js'

import { toCamelCase } from '../../../utils/camelCase.js'
import { getLogger } from '../../../utils/getLogger.js'
import { zodToInputSchema } from '../../helpers/zodToInputSchema.js'
import { toolSchemas } from '../schemas.js'

export const findGlobalTool = (
  server: McpServer,
  req: PayloadRequest,
  user: TypedUser,
  globalSlug: string,
  globals: MCPPluginConfig['globals'],
) => {
  const tool = async (
    depth: number = 0,
    locale?: string,
    fallbackLocale?: string,
    select?: string,
  ): Promise<{
    content: Array<{
      text: string
      type: 'text'
    }>
  }> => {
    const payload = req.payload
    const logger = getLogger({ payload })

    logger.info(
      `Reading global: ${globalSlug}, depth: ${depth}${locale ? `, locale: ${locale}` : ''}`,
    )

    try {
      const findOptions: Parameters<typeof payload.findGlobal>[0] = {
        slug: globalSlug,
        depth,
        user,
      }

      let selectClause: SelectType | undefined
      if (select) {
        try {
          selectClause = JSON.parse(select) as SelectType
        } catch (_parseError) {
          logger.warn(`Invalid select clause JSON for global: ${select}`)
          const response = {
            content: [{ type: 'text' as const, text: 'Error: Invalid JSON in select clause' }],
          }
          return (globals?.[globalSlug]?.overrideResponse?.(response, {}, req) || response) as {
            content: Array<{
              text: string
              type: 'text'
            }>
          }
        }
      }

      // Add locale parameters if provided
      if (locale) {
        findOptions.locale = locale
      }
      if (fallbackLocale) {
        findOptions.fallbackLocale = fallbackLocale
      }
      if (selectClause) {
        findOptions.select = selectClause
      }

      const result = await payload.findGlobal(findOptions)

      logger.info(`Found global: ${globalSlug}`)

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
      logger.error(`Error reading global ${globalSlug}: ${errorMessage}`)
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
        inputSchema: zodToInputSchema(toolSchemas.findGlobal.parameters),
      },
      async ({ depth, fallbackLocale, locale, select }: any) => {
        return await tool(depth, locale, fallbackLocale, select)
      },
    )
  }
}
