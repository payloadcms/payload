import { findDocumentsInputSchema, parseDocumentID } from 'payload'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineCollectionTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'

const DEFAULT_DESCRIPTION =
  'Find documents in any collection by passing the collection slug and optional ID or where clause.'

export const findDocumentsTool = defineCollectionTool({
  access: (args) =>
    defaultAccess(args) && Boolean(args.permissions?.collections?.[args.slug]?.read),
  annotations: {
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    readOnlyHint: true,
    title: 'Find Documents',
  },
  description: DEFAULT_DESCRIPTION,
  input: findDocumentsInputSchema,
}).handler(async ({ slug, authorizedMCP, input, req }) => {
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
    `Reading document from collection: ${slug}${id ? ` with ID: ${id}` : ''}, limit: ${limit}, page: ${page}${locale ? `, locale: ${locale}` : ''}`,
  )

  try {
    if (id !== undefined) {
      try {
        const doc = await payload.findByID({
          id: parseDocumentID({ id, collectionSlug: slug, payload }),
          collection: slug,
          depth,
          overrideAccess: authorizedMCP.overrideAccess,
          req,
          ...(select && { select }),
          ...(populate && { populate }),
          ...(joins !== undefined && { joins }),
          ...(locale && { locale }),
          ...(fallbackLocale !== undefined && { fallbackLocale }),
          ...(draft !== undefined && { draft }),
          ...(trash !== undefined && { trash }),
        })

        return {
          content: [
            {
              type: 'text',
              text: `Document from collection "${slug}":\n${JSON.stringify(doc)}`,
            },
          ],
          doc: doc as Record<string, unknown>,
        }
      } catch {
        logger.warn(`Document not found with ID: ${id} in collection: ${slug}`)
        return {
          content: [
            {
              type: 'text',
              text: `Error: Document with ID "${id}" not found in collection "${slug}"`,
            },
          ],
        }
      }
    }

    const findOptions: Parameters<typeof payload.find>[0] = {
      collection: slug,
      depth,
      limit,
      overrideAccess: authorizedMCP.overrideAccess,
      page,
      req,
      ...(select && { select }),
      ...(populate && { populate }),
      ...(joins !== undefined && { joins }),
      ...(locale && { locale }),
      ...(fallbackLocale !== undefined && { fallbackLocale }),
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

    let responseText = `Collection: "${slug}"\nTotal: ${result.totalDocs} documents\nPage: ${result.page} of ${result.totalPages}\n`
    for (const doc of result.docs) {
      responseText += `\n\`\`\`json\n${JSON.stringify(doc)}\n\`\`\``
    }

    return {
      content: [{ type: 'text', text: responseText }],
      doc: result as unknown as Record<string, unknown>,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error reading documents from collection ${slug}: ${errorMessage}`)
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Error reading documents from collection "${slug}":** ${errorMessage}`,
        },
      ],
    }
  }
})
