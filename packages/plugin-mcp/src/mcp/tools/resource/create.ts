import type { McpServer } from '@modelcontextprotocol/server'
import type { PayloadRequest, SelectType, TypedUser } from 'payload'

import { fromJsonSchema } from '@modelcontextprotocol/server'

import type { JsonSchemaObject, MCPPluginConfig } from '../../../types.js'

import { toCamelCase } from '../../../utils/camelCase.js'
import { getLogger } from '../../../utils/getLogger.js'
import {
  getCollectionVirtualFieldNames,
  stripVirtualFields,
} from '../../../utils/getVirtualFieldNames.js'
import { prepareCollectionSchema } from '../../../utils/schemaConversion/prepareCollectionSchema.js'
import { transformPointDataToPayload } from '../../../utils/transformPointDataToPayload.js'
import { toolSchemas } from '../schemas.js'
export const createResourceTool = (
  server: McpServer,
  req: PayloadRequest,
  user: TypedUser,
  collectionSlug: string,
  collections: MCPPluginConfig['collections'],
  schema: JsonSchemaObject,
) => {
  const tool = async (
    data: string,
    depth: number = 0,
    draft: boolean,
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
      `Creating resource in collection: ${collectionSlug}${locale ? ` with locale: ${locale}` : ''}`,
    )

    try {
      // Parse the data JSON
      let parsedData: Record<string, unknown>
      try {
        parsedData = JSON.parse(data)

        // Transform point fields from object format to tuple array
        parsedData = transformPointDataToPayload(parsedData)

        const virtualFieldNames = getCollectionVirtualFieldNames(payload.config, collectionSlug)
        parsedData = stripVirtualFields(parsedData, virtualFieldNames)

        logger.info(`Parsed data for ${collectionSlug}: ${JSON.stringify(parsedData)}`)
      } catch (_parseError) {
        logger.error(`Invalid JSON data provided: ${data}`)
        return {
          content: [{ type: 'text' as const, text: 'Error: Invalid JSON data provided' }],
        }
      }

      let selectClause: SelectType | undefined
      if (select) {
        try {
          selectClause = JSON.parse(select) as SelectType
        } catch (_parseError) {
          logger.warn(`Invalid select clause JSON: ${select}`)
          const response = {
            content: [{ type: 'text' as const, text: 'Error: Invalid JSON in select clause' }],
          }
          return (collections?.[collectionSlug]?.overrideResponse?.(response, {}, req) ||
            response) as {
            content: Array<{
              text: string
              type: 'text'
            }>
          }
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
        ...(selectClause && { select: selectClause }),
      })

      logger.info(`Successfully created resource in ${collectionSlug} with ID: ${result.id}`)

      const response = {
        content: [
          {
            type: 'text' as const,
            text: `Resource created successfully in collection "${collectionSlug}"!
Created resource:
\`\`\`json
${JSON.stringify(result)}
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
      logger.error(`Error creating resource in ${collectionSlug}: ${errorMessage}`)

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
    const collectionFields = prepareCollectionSchema(schema)

    const inputSchemaJson: JsonSchemaObject = {
      type: 'object',
      properties: {
        ...(collectionFields.properties ?? {}),
        depth: {
          type: 'integer',
          default: 0,
          description: 'How many levels deep to populate relationships in response',
          maximum: 10,
          minimum: 0,
        },
        draft: {
          type: 'boolean',
          default: false,
          description: 'Whether to create the document as a draft',
        },
        fallbackLocale: {
          type: 'string',
          description:
            'Optional: fallback locale code to use when requested locale is not available',
        },
        locale: {
          type: 'string',
          description:
            'Optional: locale code to create the document in (e.g., "en", "es"). Defaults to the default locale',
        },
        select: {
          type: 'string',
          description:
            'Optional: define exactly which fields you\'d like to create (JSON), e.g., \'{"title": "My Post"}\'',
        },
      },
      ...(collectionFields.required ? { required: collectionFields.required } : {}),
    }

    server.registerTool(
      `create${collectionSlug.charAt(0).toUpperCase() + toCamelCase(collectionSlug).slice(1)}`,
      {
        description: `${collections?.[collectionSlug]?.description || toolSchemas.createResource.description.trim()}`,
        inputSchema: fromJsonSchema(inputSchemaJson as Parameters<typeof fromJsonSchema>[0]),
      },
      async (rawParams: unknown) => {
        const params = (rawParams ?? {}) as Record<string, unknown>
        const { depth, draft, fallbackLocale, locale, select, ...fieldData } = params
        const data = JSON.stringify(fieldData)
        return await tool(
          data,
          depth as number,
          draft as boolean,
          locale as string | undefined,
          fallbackLocale as string | undefined,
          select as string | undefined,
        )
      },
    )
  }
}
