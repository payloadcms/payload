import type { SelectType } from 'payload'

import { z } from 'zod'

import { defineCollectionTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'
import { localAPIDefaults } from '../../../utils/localAPIDefaults.js'

const DEFAULT_DESCRIPTION =
  'Find documents in a collection by ID or where clause using Find or FindByID.'

export const findCollectionTool = defineCollectionTool({
  description: DEFAULT_DESCRIPTION,
  input: z.object({
    id: z
      .union([z.string(), z.number()])
      .describe(
        'Optional: specific document ID to retrieve. If not provided, returns all documents',
      )
      .optional(),
    depth: z
      .number()
      .int()
      .min(0)
      .max(10)
      .describe('How many levels deep to populate relationships (default: 0)')
      .optional()
      .default(0),
    draft: z
      .boolean()
      .describe(
        'Optional: whether the document should be queried from the versions table/collection or not.',
      )
      .optional(),
    fallbackLocale: z
      .string()
      .describe('Optional: fallback locale code to use when requested locale is not available')
      .optional(),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .describe('Maximum number of documents to return (default: 10, max: 100)')
      .optional()
      .default(10),
    locale: z
      .string()
      .describe(
        'Optional: locale code to retrieve data in (e.g., "en", "es"). Use "all" to retrieve all locales for localized fields',
      )
      .optional(),
    page: z
      .number()
      .int()
      .min(1)
      .describe('Page number for pagination (default: 1)')
      .optional()
      .default(1),
    select: z
      .string()
      .describe(
        "Optional: define exactly which fields you'd like to return in the response (JSON), e.g., '{\"title\": true}'",
      )
      .optional(),
    sort: z
      .string()
      .describe('Field to sort by (e.g., "createdAt", "-updatedAt" for descending)')
      .optional(),
    where: z
      .string()
      .describe(
        'Optional JSON string for where clause filtering (e.g., \'{"title": {"contains": "test"}}\')',
      )
      .optional(),
  }),
}).handler(async ({ authorizedMCP, collectionSlug, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })

  const { id, depth, draft, fallbackLocale, limit, locale, page, select, sort, where } = input

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
        return { content: [{ type: 'text', text: 'Error: Invalid JSON in where clause' }] }
      }
    }

    let selectClause: SelectType | undefined
    if (select) {
      try {
        selectClause = JSON.parse(select) as SelectType
      } catch {
        logger.warn(`Invalid select clause JSON: ${select}`)
        return { content: [{ type: 'text', text: 'Error: Invalid JSON in select clause' }] }
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

        return {
          content: [
            {
              type: 'text',
              text: `Document from collection "${collectionSlug}":\n${JSON.stringify(doc)}`,
            },
          ],
          doc,
        }
      } catch {
        logger.warn(`Document not found with ID: ${id} in collection: ${collectionSlug}`)
        return {
          content: [
            {
              type: 'text',
              text: `Error: Document with ID "${id}" not found in collection "${collectionSlug}"`,
            },
          ],
        }
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

    return {
      content: [{ type: 'text', text: responseText }],
      doc: result as unknown as Record<string, unknown>,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error reading documents from collection ${collectionSlug}: ${errorMessage}`)
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Error reading documents from collection "${collectionSlug}":** ${errorMessage}`,
        },
      ],
    }
  }
})
