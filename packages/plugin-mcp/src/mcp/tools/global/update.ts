import type { McpServer } from '@modelcontextprotocol/server'
import type { PayloadRequest, SelectType, TypedUser } from 'payload'

import { fromJsonSchema } from '@modelcontextprotocol/server'

import type { JsonSchemaObject, MCPPluginConfig } from '../../../types.js'

import { toCamelCase } from '../../../utils/camelCase.js'
import { getLogger } from '../../../utils/getLogger.js'
import {
  getGlobalVirtualFieldNames,
  stripVirtualFields,
} from '../../../utils/getVirtualFieldNames.js'
import { prepareCollectionSchema } from '../../../utils/schemaConversion/prepareCollectionSchema.js'
import { toolSchemas } from '../schemas.js'

export const updateGlobalTool = (
  server: McpServer,
  req: PayloadRequest,
  user: TypedUser,
  globalSlug: string,
  globals: MCPPluginConfig['globals'],
  schema: JsonSchemaObject,
) => {
  const tool = async (
    data: string,
    draft: boolean = false,
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
      `Updating global: ${globalSlug}, draft: ${draft}${locale ? `, locale: ${locale}` : ''}`,
    )

    try {
      // Parse the data JSON
      let parsedData: Record<string, unknown>
      try {
        parsedData = JSON.parse(data)

        const virtualFieldNames = getGlobalVirtualFieldNames(payload.config, globalSlug)
        parsedData = stripVirtualFields(parsedData, virtualFieldNames)

        logger.info(`Parsed data for ${globalSlug}: ${JSON.stringify(parsedData)}`)
      } catch (_parseError) {
        logger.error(`Invalid JSON data provided: ${data}`)
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

      const updateOptions: Parameters<typeof payload.updateGlobal>[0] = {
        slug: globalSlug,
        data: parsedData,
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
      if (selectClause) {
        updateOptions.select = selectClause
      }

      const result = await payload.updateGlobal(updateOptions)

      logger.info(`Successfully updated global: ${globalSlug}`)

      const response = {
        content: [
          {
            type: 'text' as const,
            text: `Global "${globalSlug}" updated successfully!
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
      logger.error(`Error updating global ${globalSlug}: ${errorMessage}`)

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
    const globalFields = prepareCollectionSchema(schema)

    // Update is partial — drop the global's `required` so all collection fields are optional.
    const inputSchemaJson: JsonSchemaObject = {
      type: 'object',
      properties: {
        ...(globalFields.properties ?? {}),
        depth: { type: 'number', description: 'Optional: Depth of relationships to populate' },
        draft: {
          type: 'boolean',
          description: 'Optional: Whether to save as draft (default: false)',
        },
        fallbackLocale: {
          type: 'string',
          description:
            'Optional: fallback locale code to use when requested locale is not available',
        },
        locale: {
          type: 'string',
          description:
            'Optional: locale code to update data in (e.g., "en", "es"). Use "all" to update all locales for localized fields',
        },
        select: {
          type: 'string',
          description:
            'Optional: define exactly which fields you\'d like to return in the response (JSON), e.g., \'{"siteName": "My Site"}\'',
        },
      },
    }

    server.registerTool(
      `update${globalSlug.charAt(0).toUpperCase() + toCamelCase(globalSlug).slice(1)}`,
      {
        description: `${toolSchemas.updateGlobal.description.trim()}\n\n${globals?.[globalSlug]?.description || ''}`,
        inputSchema: fromJsonSchema(inputSchemaJson as Parameters<typeof fromJsonSchema>[0]),
      },
      async (rawParams: unknown) => {
        const params = (rawParams ?? {}) as Record<string, unknown>
        const { depth, draft, fallbackLocale, locale, select, ...rest } = params
        const data = JSON.stringify(rest)
        return await tool(
          data,
          draft as boolean,
          depth as number,
          locale as string,
          fallbackLocale as string,
          select as string | undefined,
        )
      },
    )
  }
}
