import { getPayloadOperation, invokeOperation } from 'payload'
import { z } from 'zod'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineCollectionTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'

const deleteOperation = getPayloadOperation('collection', 'delete')

const DEFAULT_DESCRIPTION =
  'Delete documents in any collection by passing the collection slug and ID or where clause.'

export const deleteDocumentsTool = defineCollectionTool({
  access: (args) =>
    defaultAccess(args) && Boolean(args.permissions?.collections?.[args.collectionSlug]?.delete),
  annotations: {
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
    readOnlyHint: false,
    title: 'Delete Documents',
  },
  description: DEFAULT_DESCRIPTION,
  input: z
    .looseObject({
      id: deleteOperation.input.shape.id,
      depth: deleteOperation.input.shape.depth,
      fallbackLocale: deleteOperation.input.shape.fallbackLocale,
      locale: deleteOperation.input.shape.locale,
      where: deleteOperation.input.shape.where,
    })
    .refine(({ id, where }) => id !== undefined || where !== undefined, {
      message: 'Either id or where must be provided',
    }),
}).handler(async ({ authorizedMCP, collectionSlug, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })

  const { id, depth, fallbackLocale, locale, where } = input

  logger.info(
    `Deleting document from collection: ${collectionSlug}${id ? ` with ID: ${id}` : ' with where clause'}${locale ? `, locale: ${locale}` : ''}`,
  )

  try {
    if (!id && !where) {
      return {
        content: [{ type: 'text', text: 'Error: Either id or where clause must be provided' }],
      }
    }

    const deleteOptions = {
      collection: collectionSlug,
      depth,
      overrideAccess: authorizedMCP.overrideAccess,
      req,
      ...(locale && { locale }),
      ...(fallbackLocale && { fallbackLocale }),
      ...(id !== undefined ? { id } : { where: where! }),
    }

    const result = await invokeOperation(deleteOperation, {
      context: payload,
      input: deleteOptions,
    })

    if (id) {
      return {
        content: [
          {
            type: 'text',
            text: `Document deleted successfully from collection "${collectionSlug}"!\nDeleted document:\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
          },
        ],
        doc: result as Record<string, unknown>,
      }
    }

    const bulkResult = result as { docs?: unknown[]; errors?: unknown[] }
    const docs = bulkResult.docs || []
    const errors = bulkResult.errors || []

    let responseText = `Document deleted successfully from collection "${collectionSlug}"!\nDeleted: ${docs.length} documents\nErrors: ${errors.length}\n---`
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
    logger.error(`Error deleting document from ${collectionSlug}: ${errorMessage}`)
    return {
      content: [
        {
          type: 'text',
          text: `Error deleting document from collection "${collectionSlug}": ${errorMessage}`,
        },
      ],
    }
  }
})
