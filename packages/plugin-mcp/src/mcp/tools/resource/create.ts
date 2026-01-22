import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { JSONSchema4 } from 'json-schema'
import type { PayloadRequest, TypedUser } from 'payload'

import { z } from 'zod'

import type { PluginMCPServerConfig } from '../../../types.js'

import { toCamelCase } from '../../../utils/camelCase.js'
import { convertCollectionSchemaToZod } from '../../../utils/convertCollectionSchemaToZod.js'
import { toolSchemas } from '../schemas.js'
export const createResourceTool = (
  server: McpServer,
  req: PayloadRequest,
  user: TypedUser,
  verboseLogs: boolean,
  collectionSlug: string,
  collections: PluginMCPServerConfig['collections'],
  schema: JSONSchema4,
) => {
  const tool = async (
    data: string,
    depth: number = 0,
    draft: boolean,
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
        `[payload-mcp] Creating resource in collection: ${collectionSlug}${locale ? ` with locale: ${locale}` : ''}`,
      )
    }

    try {
      // Parse the data JSON
      let parsedData: Record<string, unknown>
      try {
        parsedData = JSON.parse(data)
        if (verboseLogs) {
          payload.logger.info(
            `[payload-mcp] Parsed data for ${collectionSlug}: ${JSON.stringify(parsedData)}`,
          )
        }
      } catch (_parseError) {
        payload.logger.error(`[payload-mcp] Invalid JSON data provided: ${data}`)
        return {
          content: [{ type: 'text' as const, text: 'Error: Invalid JSON data provided' }],
        }
      }

      // Create the resource
      const result = await payload.create({
        collection: collectionSlug,
        data: parsedData,
        depth,
        draft,
        overrideAccess: false,
        req,
        user,
        ...(locale && { locale }),
        ...(fallbackLocale && { fallbackLocale }),
      })

      if (verboseLogs) {
        payload.logger.info(
          `[payload-mcp] Successfully created resource in ${collectionSlug} with ID: ${result.id}`,
        )
      }

      const response = {
        content: [
          {
            type: 'text' as const,
            text: `Resource created successfully in collection "${collectionSlug}"!
Created resource:
\`\`\`json
${JSON.stringify(result, null, 2)}
\`\`\``,
          },
        ],
      }

      return (collections?.[collectionSlug]?.overrideResponse?.(response, result, req) ||
        response) as {
        content: Array<{
          text: string
          type: 'text'
        }>
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      payload.logger.error(
        `[payload-mcp] Error creating resource in ${collectionSlug}: ${errorMessage}`,
      )

      const response = {
        content: [
          {
            type: 'text' as const,
            text: `Error creating resource in collection "${collectionSlug}": ${errorMessage}`,
          },
        ],
      }

      return (collections?.[collectionSlug]?.overrideResponse?.(response, {}, req) || response) as {
        content: Array<{
          text: string
          type: 'text'
        }>
      }
    }
  }

  if (collections?.[collectionSlug]?.enabled) {
    const convertedFields = convertCollectionSchemaToZod(schema)

    // Create a new schema that combines the converted fields with create-specific parameters
    const createResourceSchema = z.object({
      ...convertedFields.shape,
      depth: z
        .number()
        .int()
        .min(0)
        .max(10)
        .optional()
        .default(0)
        .describe('How many levels deep to populate relationships in response'),
      draft: z
        .boolean()
        .optional()
        .default(false)
        .describe('Whether to create the document as a draft'),
      fallbackLocale: z
        .string()
        .optional()
        .describe('Optional: fallback locale code to use when requested locale is not available'),
      locale: z
        .string()
        .optional()
        .describe(
          'Optional: locale code to create the document in (e.g., "en", "es"). Defaults to the default locale',
        ),
    })

    server.tool(
      `create${collectionSlug.charAt(0).toUpperCase() + toCamelCase(collectionSlug).slice(1)}`,
      `${collections?.[collectionSlug]?.description || toolSchemas.createResource.description.trim()}`,
      createResourceSchema.shape,
      async (params: Record<string, unknown>) => {
        const { depth, draft, fallbackLocale, locale, ...fieldData } = params
        const data = JSON.stringify(fieldData)
        return await tool(
          data,
          depth as number,
          draft as boolean,
          locale as string | undefined,
          fallbackLocale as string | undefined,
        )
      },
    )
  }
}
