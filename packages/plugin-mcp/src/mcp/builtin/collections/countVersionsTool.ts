import { getPayloadOperation, invokeOperation } from 'payload'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineCollectionTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'

const countVersionsOperation = getPayloadOperation('collection', 'countVersions')

const DEFAULT_DESCRIPTION =
  'Count document versions in any version-enabled collection by passing the collection slug and optional where clause.'

export const countVersionsTool = defineCollectionTool({
  access: (args) =>
    defaultAccess(args) &&
    Boolean(args.permissions?.collections?.[args.collectionSlug]?.readVersions),
  annotations: {
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    readOnlyHint: true,
    title: 'Count Versions',
  },
  description: DEFAULT_DESCRIPTION,
  input: countVersionsOperation.input.omit({ collection: true }),
}).handler(async ({ authorizedMCP, collectionSlug, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })
  const { locale, where } = input

  logger.info(`Counting versions in collection: ${collectionSlug}`)

  try {
    const result = await invokeOperation(countVersionsOperation, {
      context: payload,
      input: {
        collection: collectionSlug,
        overrideAccess: authorizedMCP.overrideAccess,
        req,
        ...(locale ? { locale } : {}),
        ...(where ? { where } : {}),
      },
    })

    return {
      content: [
        {
          type: 'text',
          text: `Collection "${collectionSlug}" contains ${result.totalDocs} matching versions.\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
        },
      ],
      doc: result,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error counting versions in ${collectionSlug}: ${errorMessage}`)
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Error counting versions in collection "${collectionSlug}":** ${errorMessage}`,
        },
      ],
      isError: true,
    }
  }
})
