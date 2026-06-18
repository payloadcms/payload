import { z } from 'zod'

import { defineCollectionTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'
import { localAPIDefaults } from '../../../utils/localAPIDefaults.js'
import { whereSchema } from '../../../utils/whereSchema.js'

const DEFAULT_DESCRIPTION =
  'Count document versions in any version-enabled collection by passing the collection slug and optional where clause.'

export const countVersionsTool = defineCollectionTool({
  annotations: {
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    readOnlyHint: true,
    title: 'Count Versions',
  },
  description: DEFAULT_DESCRIPTION,
  input: z.object({
    locale: z
      .string()
      .describe('Optional: locale code to count versions in')
      .optional(),
    where: whereSchema
      .describe(
        'Optional: where clause for filtering versions. Version document fields are usually under "version". Example: {"version.title":{"contains":"test"}}',
      )
      .optional(),
  }),
}).handler(async ({ authorizedMCP, collectionSlug, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })
  const { locale, where } = input

  logger.info(`Counting versions in collection: ${collectionSlug}`)

  try {
    const result = await payload.countVersions({
      collection: collectionSlug,
      req,
      ...localAPIDefaults(authorizedMCP),
      ...(locale ? { locale } : {}),
      ...(where ? { where } : {}),
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
