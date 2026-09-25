import { deleteDocumentsInputSchema, parseDocumentID } from 'payload'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineCollectionTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'

const DEFAULT_DESCRIPTION =
  'Delete documents in any collection by passing the collection slug and ID or where clause.'

export const deleteDocumentsTool = defineCollectionTool({
  access: (args) =>
    defaultAccess(args) && Boolean(args.permissions?.collections?.[args.slug]?.delete),
  annotations: {
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
    readOnlyHint: false,
    title: 'Delete Documents',
  },
  description: DEFAULT_DESCRIPTION,
  input: deleteDocumentsInputSchema,
}).handler(async ({ slug, authorizedMCP, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })

  const { id, depth, fallbackLocale, locale, where } = input

  logger.info(
    `Deleting document from collection: ${slug}${id ? ` with ID: ${id}` : ' with where clause'}${locale ? `, locale: ${locale}` : ''}`,
  )

  try {
    if (id !== undefined) {
      const result = await payload.delete({
        id: parseDocumentID({ id, collectionSlug: slug, payload }),
        collection: slug,
        depth,
        overrideAccess: authorizedMCP.overrideAccess,
        req,
        ...(locale && { locale }),
        ...(fallbackLocale !== undefined && { fallbackLocale }),
      })

      return {
        content: [
          {
            type: 'text',
            text: `Document deleted successfully from collection "${slug}"!\nDeleted document:\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
          },
        ],
        doc: result as Record<string, unknown>,
      }
    }

    if (where === undefined) {
      return {
        content: [{ type: 'text', text: 'Error: Either id or where clause must be provided' }],
      }
    }

    const result = await payload.delete({
      collection: slug,
      depth,
      overrideAccess: authorizedMCP.overrideAccess,
      req,
      where,
      ...(locale && { locale }),
      ...(fallbackLocale !== undefined && { fallbackLocale }),
    })
    const docs = result.docs || []
    const errors = result.errors || []

    let responseText = `Document deleted successfully from collection "${slug}"!\nDeleted: ${docs.length} documents\nErrors: ${errors.length}\n---`
    if (docs.length > 0) {
      responseText += `\n\nDeleted documents:\n\`\`\`json\n${JSON.stringify(docs)}\n\`\`\``
    }
    if (errors.length > 0) {
      responseText += `\n\nErrors:\n\`\`\`json\n${JSON.stringify(errors)}\n\`\`\``
    }

    return {
      content: [{ type: 'text', text: responseText }],
      doc: { docs, errors } as unknown as Record<string, unknown>,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error deleting document from ${slug}: ${errorMessage}`)
    return {
      content: [
        {
          type: 'text',
          text: `Error deleting document from collection "${slug}": ${errorMessage}`,
        },
      ],
    }
  }
})
