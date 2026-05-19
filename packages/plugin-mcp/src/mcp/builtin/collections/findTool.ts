import type { SelectType } from 'payload'

import type { CollectionTool, JsonSchemaType, MCPToolResponse } from '../../../types.js'

import { getLogger } from '../../../utils/getLogger.js'
import { localAPIDefaults } from '../../../utils/localAPIDefaults.js'

const DEFAULT_DESCRIPTION =
  'Find documents in a collection by ID or where clause using Find or FindByID.'

const inputSchema: JsonSchemaType = {
  type: 'object',
  properties: {
    depth: {
      type: 'integer',
      default: 0,
      description: 'How many levels deep to populate relationships (default: 0)',
      maximum: 10,
      minimum: 0,
    },
    draft: {
      type: 'boolean',
      description:
        'Optional: whether the document should be queried from the versions table/collection or not.',
    },
    fallbackLocale: {
      type: 'string',
      description: 'Optional: fallback locale code to use when requested locale is not available',
    },
    id: {
      type: ['string', 'number'],
      description:
        'Optional: specific document ID to retrieve. If not provided, returns all documents',
    },
    limit: {
      type: 'integer',
      default: 10,
      description: 'Maximum number of documents to return (default: 10, max: 100)',
      maximum: 100,
      minimum: 1,
    },
    locale: {
      type: 'string',
      description:
        'Optional: locale code to retrieve data in (e.g., "en", "es"). Use "all" to retrieve all locales for localized fields',
    },
    page: {
      type: 'integer',
      default: 1,
      description: 'Page number for pagination (default: 1)',
      minimum: 1,
    },
    select: {
      type: 'string',
      description:
        "Optional: define exactly which fields you'd like to return in the response (JSON), e.g., '{\"title\": true}'",
    },
    sort: {
      type: 'string',
      description: 'Field to sort by (e.g., "createdAt", "-updatedAt" for descending)',
    },
    where: {
      type: 'string',
      description:
        'Optional JSON string for where clause filtering (e.g., \'{"title": {"contains": "test"}}\')',
    },
  },
}

export const findCollectionTool: CollectionTool = {
  description: DEFAULT_DESCRIPTION,
  handler: async ({ authorizedMCP, collectionSlug, input, overrideResponse, req }) => {
    const payload = req.payload
    const logger = getLogger({ payload })

    const id = input.id as number | string | undefined
    const limit = (input.limit as number | undefined) ?? 10
    const page = (input.page as number | undefined) ?? 1
    const sort = input.sort as string | undefined
    const where = input.where as string | undefined
    const select = input.select as string | undefined
    const depth = (input.depth as number | undefined) ?? 0
    const locale = input.locale as string | undefined
    const fallbackLocale = input.fallbackLocale as string | undefined
    const draft = input.draft as boolean | undefined

    const applyOverride = (response: MCPToolResponse, doc: Record<string, unknown>) =>
      overrideResponse?.(response, doc, req) || response

    logger.info(
      `Reading document from collection: ${collectionSlug}${id ? ` with ID: ${id}` : ''}, limit: ${limit}, page: ${page}${locale ? `, locale: ${locale}` : ''}`,
    )

    try {
      let whereClause: Record<string, unknown> = {}
      if (where) {
        try {
          whereClause = JSON.parse(where) as Record<string, unknown>
        } catch {
          logger.warn(`Invalid where clause JSON: ${where}`)
          return applyOverride(
            { content: [{ type: 'text', text: 'Error: Invalid JSON in where clause' }] },
            {},
          )
        }
      }

      let selectClause: SelectType | undefined
      if (select) {
        try {
          selectClause = JSON.parse(select) as SelectType
        } catch {
          logger.warn(`Invalid select clause JSON: ${select}`)
          return applyOverride(
            { content: [{ type: 'text', text: 'Error: Invalid JSON in select clause' }] },
            {},
          )
        }
      }

      if (id) {
        try {
          const doc = await payload.findByID({
            id,
            collection: collectionSlug,
            depth,
            req,
            ...localAPIDefaults(authorizedMCP),
            ...(selectClause && { select: selectClause }),
            ...(locale && { locale }),
            ...(fallbackLocale && { fallbackLocale }),
            ...(draft !== undefined && { draft }),
          })

          return applyOverride(
            {
              content: [
                {
                  type: 'text',
                  text: `Document from collection "${collectionSlug}":\n${JSON.stringify(doc)}`,
                },
              ],
            },
            doc as Record<string, unknown>,
          )
        } catch {
          logger.warn(`Document not found with ID: ${id} in collection: ${collectionSlug}`)
          return applyOverride(
            {
              content: [
                {
                  type: 'text',
                  text: `Error: Document with ID "${id}" not found in collection "${collectionSlug}"`,
                },
              ],
            },
            {},
          )
        }
      }

      const findOptions: Parameters<typeof payload.find>[0] = {
        collection: collectionSlug,
        depth,
        limit,
        page,
        req,
        ...localAPIDefaults(authorizedMCP),
        ...(selectClause && { select: selectClause }),
        ...(locale && { locale }),
        ...(fallbackLocale && { fallbackLocale }),
        ...(draft !== undefined && { draft }),
      }

      if (sort) {
        findOptions.sort = sort
      }
      if (Object.keys(whereClause).length > 0) {
        findOptions.where = whereClause as Parameters<typeof payload.find>[0]['where']
      }

      const result = await payload.find(findOptions)

      let responseText = `Collection: "${collectionSlug}"\nTotal: ${result.totalDocs} documents\nPage: ${result.page} of ${result.totalPages}\n`
      for (const doc of result.docs) {
        responseText += `\n\`\`\`json\n${JSON.stringify(doc)}\n\`\`\``
      }

      return applyOverride(
        { content: [{ type: 'text', text: responseText }] },
        result as unknown as Record<string, unknown>,
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`Error reading documents from collection ${collectionSlug}: ${errorMessage}`)
      return applyOverride(
        {
          content: [
            {
              type: 'text',
              text: `❌ **Error reading documents from collection "${collectionSlug}":** ${errorMessage}`,
            },
          ],
        },
        {},
      )
    }
  },
  input: inputSchema,
}
