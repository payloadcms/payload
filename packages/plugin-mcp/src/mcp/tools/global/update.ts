import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { JSONSchema4 } from 'json-schema'
import type { PayloadRequest, TypedUser } from 'payload'

import { z } from 'zod'

import type { PluginMCPServerConfig } from '../../../types.js'

import { toCamelCase } from '../../../utils/camelCase.js'
import { convertCollectionSchemaToZod } from '../../../utils/convertCollectionSchemaToZod.js'
import { toolSchemas } from '../schemas.js'

export const updateGlobalTool = (
  server: McpServer,
  req: PayloadRequest,
  user: TypedUser,
  verboseLogs: boolean,
  globalSlug: string,
  globals: PluginMCPServerConfig['globals'],
  schema: JSONSchema4,
) => {
  const tool = async (
    data: string,
    draft: boolean = false,
    depth: number = 0,
    locale?: string,
    fallbackLocale?: string,
  ): Promise<{
    content: Array<{
      text: string
      type: 'text'
    }>
  }> => {
    const payload = req.payload

    if (verboseLogs) {
      payload.logger.info(
        `[payload-mcp] Updating global: ${globalSlug}, draft: ${draft}${locale ? `, locale: ${locale}` : ''}`,
      )
    }

    try {
      // Parse the data JSON
      let parsedData: Record<string, unknown>
      try {
        parsedData = JSON.parse(data)
        if (verboseLogs) {
          payload.logger.info(
            `[payload-mcp] Parsed data for ${globalSlug}: ${JSON.stringify(parsedData)}`,
          )
        }
      } catch (_parseError) {
        payload.logger.error(`[payload-mcp] Invalid JSON data provided: ${data}`)
        const response = {
          content: [{ type: 'text' as const, text: 'Error: Invalid JSON data provided' }],
        }
        return (globals?.[globalSlug]?.overrideResponse?.(response, {}, req) || response) as {
          content: Array<{
            text: string
            type: 'text'
          }>
        }
      }

      const updateOptions: Parameters<typeof payload.updateGlobal>[0] = {
        slug: globalSlug,
        data: globals?.[globalSlug]?.override?.(parsedData, req) || parsedData,
        depth,
        draft,
        user,
      }

      // Add locale parameters if provided
      if (locale) {
        updateOptions.locale = locale
      }
      if (fallbackLocale) {
        updateOptions.fallbackLocale = fallbackLocale
      }

      const result = await payload.updateGlobal(updateOptions)

      if (verboseLogs) {
        payload.logger.info(`[payload-mcp] Successfully updated global: ${globalSlug}`)
      }

      const response = {
        content: [
          {
            type: 'text' as const,
            text: `Global "${globalSlug}" updated successfully!
Updated global:
\`\`\`json
${JSON.stringify(result, null, 2)}
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
      payload.logger.error(`[payload-mcp] Error updating global ${globalSlug}: ${errorMessage}`)

      const response = {
        content: [
          {
            type: 'text' as const,
            text: `Error updating global "${globalSlug}": ${errorMessage}`,
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
    const convertedFields = convertCollectionSchemaToZod(schema)

    // Make all fields optional for partial updates (PATCH-style)
    const optionalFields = Object.fromEntries(
      Object.entries(convertedFields.shape).map(([key, value]) => [key, (value as any).optional()]),
    )

    const updateGlobalSchema = z.object({
      ...optionalFields,
      depth: z.number().optional().describe('Optional: Depth of relationships to populate'),
      draft: z.boolean().optional().describe('Optional: Whether to save as draft (default: false)'),
      fallbackLocale: z
        .string()
        .optional()
        .describe('Optional: fallback locale code to use when requested locale is not available'),
      locale: z
        .string()
        .optional()
        .describe(
          'Optional: locale code to update data in (e.g., "en", "es"). Use "all" to update all locales for localized fields',
        ),
    })

    server.tool(
      `update${globalSlug.charAt(0).toUpperCase() + toCamelCase(globalSlug).slice(1)}`,
      `${toolSchemas.updateGlobal.description.trim()}\n\n${globals?.[globalSlug]?.description || ''}`,
      updateGlobalSchema.shape,
      async (params: Record<string, unknown>) => {
        const { depth, draft, fallbackLocale, locale, ...rest } = params
        const data = JSON.stringify(rest)
        return await tool(
          data,
          draft as boolean,
          depth as number,
          locale as string,
          fallbackLocale as string,
        )
      },
    )
  }
}
