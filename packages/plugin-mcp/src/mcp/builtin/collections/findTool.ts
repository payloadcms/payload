import type { JoinQuery, PopulateType, SelectType } from 'payload'

import { z } from 'zod'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineCollectionTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'
import { localAPIDefaults } from '../../../utils/localAPIDefaults.js'
import { whereSchema } from '../../../utils/whereSchema.js'

const DEFAULT_DESCRIPTION =
  'Find documents in any collection by passing the collection slug and optional ID or where clause.'

export const findDocumentsTool = defineCollectionTool({
  access: (args) =>
    defaultAccess(args) && Boolean(args.permissions?.collections?.[args.collectionSlug]?.read),
  annotations: {
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    readOnlyHint: true,
    title: 'Find Documents',
  },
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
    joins: z
      .union([z.record(z.string(), z.unknown()), z.literal(false)])
      .describe('Optional: configure join field queries, or pass false to disable all join fields.')
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
    pagination: z
      .boolean()
      .describe('Optional: set to false to skip the count query overhead')
      .optional(),
    populate: z
      .record(z.string(), z.unknown())
      .describe(
        'Optional: control which fields to include from populated relationship or upload documents.',
      )
      .optional(),
    select: z
      .record(z.string(), z.unknown())
      .describe(
        'Optional: define exactly which fields you\'d like to return in the response, e.g., {"title": true}',
      )
      .optional(),
    sort: z
      .string()
      .describe('Field to sort by (e.g., "createdAt", "-updatedAt" for descending)')
      .optional(),
    trash: z
      .boolean()
      .describe('Optional: include soft-deleted documents when trash is enabled on the collection')
      .optional(),
    where: whereSchema
      .describe(
        'Optional: where clause for filtering. Use field names with Payload operators, and/or arrays for grouping. Example: {"title":{"contains":"test"}}',
      )
      .optional(),
  }),
}).handler(async ({ authorizedMCP, collectionSlug, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })

  const {
    id,
    depth,
    draft,
    fallbackLocale,
    joins,
    limit,
    locale,
    page,
    pagination,
    populate,
    select,
    sort,
    trash,
    where,
  } = input

  logger.info(
    `Reading document from collection: ${collectionSlug}${id ? ` with ID: ${id}` : ''}, limit: ${limit}, page: ${page}${locale ? `, locale: ${locale}` : ''}`,
  )

  try {
    if (id) {
      try {
        const doc = await payload.findByID({
          id,
          collection: collectionSlug,
          depth,
          req,
          ...localAPIDefaults(authorizedMCP),
          ...(select && { select: select as SelectType }),
          ...(populate && { populate: populate as PopulateType }),
          ...(joins !== undefined && { joins: joins as JoinQuery }),
          ...(locale && { locale }),
          ...(fallbackLocale && { fallbackLocale }),
          ...(draft !== undefined && { draft }),
          ...(trash !== undefined && { trash }),
        })

        return {
          content: [
            {
              type: 'text',
              text: `Document from collection "${collectionSlug}":\n${JSON.stringify(doc)}`,
            },
          ],
          doc: doc as Record<string, unknown>,
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
      ...(select && { select: select as SelectType }),
      ...(populate && { populate: populate as PopulateType }),
      ...(joins !== undefined && { joins: joins as JoinQuery }),
      ...(locale && { locale }),
      ...(fallbackLocale && { fallbackLocale }),
      ...(draft !== undefined && { draft }),
      ...(pagination !== undefined && { pagination }),
      ...(trash !== undefined && { trash }),
    }

    if (sort) {
      findOptions.sort = sort
    }
    if (where) {
      findOptions.where = where
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
