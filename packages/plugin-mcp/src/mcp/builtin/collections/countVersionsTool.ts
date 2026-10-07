import { countVersionsInputSchema } from 'payload'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineCollectionTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'

const DEFAULT_DESCRIPTION =
  'Count document versions in any version-enabled collection by passing the collection slug and optional where clause.'

export const countVersionsTool = defineCollectionTool({
  access: (args) =>
    defaultAccess(args) && Boolean(args.permissions?.collections?.[args.slug]?.readVersions),
  annotations: {
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    readOnlyHint: true,
    title: 'Count Versions',
  },
  description: DEFAULT_DESCRIPTION,
  input: countVersionsInputSchema,
}).handler(async ({ slug, authorizedMCP, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })
  const { locale, where } = input

  logger.info(`Counting versions in collection: ${slug}`)

  try {
    const result = await payload.countVersions({
      collection: slug,
      overrideAccess: authorizedMCP.overrideAccess,
      req,
      ...(locale ? { locale } : {}),
      ...(where ? { where } : {}),
    })

    return {
      content: [
        {
          type: 'text',
          text: `Collection "${slug}" contains ${result.totalDocs} matching versions.\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
        },
      ],
      doc: result,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error counting versions in ${slug}: ${errorMessage}`)
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Error counting versions in collection "${slug}":** ${errorMessage}`,
        },
      ],
      isError: true,
    }
  }
})
