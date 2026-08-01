import {
  getPayloadOperation,
  invokeOperation,
  type JoinQuery,
  type PopulateType,
  type SelectType,
} from 'payload'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineCollectionTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'

const findOperation = getPayloadOperation('collection', 'find')
const findByIDOperation = getPayloadOperation('collection', 'findByID')

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
  input: findOperation.input
    .omit({ collection: true })
    .extend({ id: findByIDOperation.input.shape.id.optional() }),
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
        const doc = await invokeOperation(findByIDOperation, {
          context: payload,
          input: {
            id,
            collection: collectionSlug,
            depth,
            overrideAccess: authorizedMCP.overrideAccess,
            req,
            ...(select && { select: select as SelectType }),
            ...(populate && { populate: populate as PopulateType }),
            ...(joins !== undefined && { joins: joins as JoinQuery }),
            ...(locale && { locale }),
            ...(fallbackLocale && { fallbackLocale }),
            ...(draft !== undefined && { draft }),
            ...(trash !== undefined && { trash }),
          },
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
      overrideAccess: authorizedMCP.overrideAccess,
      page,
      req,
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

    const result = await invokeOperation(findOperation, {
      context: payload,
      input: findOptions as never,
    })

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
