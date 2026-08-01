import { getPayloadOperation, invokeOperation } from 'payload'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineCollectionTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'

const countOperation = getPayloadOperation('collection', 'count')

const DEFAULT_DESCRIPTION =
  'Count documents in any collection by passing the collection slug and optional where clause.'

export const countDocumentsTool = defineCollectionTool({
  access: (args) =>
    defaultAccess(args) && Boolean(args.permissions?.collections?.[args.collectionSlug]?.read),
  annotations: {
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    readOnlyHint: true,
    title: 'Count Documents',
  },
  description: DEFAULT_DESCRIPTION,
  input: countOperation.input.omit({ collection: true }),
}).handler(async ({ authorizedMCP, collectionSlug, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })
  const { locale, trash, where } = input

  logger.info(`Counting documents in collection: ${collectionSlug}`)

  try {
    const result = await invokeOperation(countOperation, {
      context: payload,
      input: {
        collection: collectionSlug,
        overrideAccess: authorizedMCP.overrideAccess,
        req,
        ...(locale ? { locale } : {}),
        ...(trash !== undefined ? { trash } : {}),
        ...(where ? { where } : {}),
      },
    })

    return {
      content: [
        {
          type: 'text',
          text: `Collection "${collectionSlug}" contains ${result.totalDocs} matching documents.\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
        },
      ],
      doc: result,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error counting documents in ${collectionSlug}: ${errorMessage}`)
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Error counting documents in collection "${collectionSlug}":** ${errorMessage}`,
        },
      ],
      isError: true,
    }
  }
})
