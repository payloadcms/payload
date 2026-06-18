import { z } from 'zod'

import { defineCollectionTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'
import { localAPIDefaults } from '../../../utils/localAPIDefaults.js'
import { whereSchema } from '../../../utils/whereSchema.js'

const DEFAULT_DESCRIPTION =
  'Count documents in any collection by passing the collection slug and optional where clause.'

export const countDocumentsTool = defineCollectionTool({
  annotations: {
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    readOnlyHint: true,
    title: 'Count Documents',
  },
  description: DEFAULT_DESCRIPTION,
  input: z.object({
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
  const { trash, where } = input

  logger.info(`Counting documents in collection: ${collectionSlug}`)

  try {
    const result = await payload.count({
      collection: collectionSlug,
      req,
      ...localAPIDefaults(authorizedMCP),
      ...(trash !== undefined ? { trash } : {}),
      ...(where ? { where } : {}),
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
