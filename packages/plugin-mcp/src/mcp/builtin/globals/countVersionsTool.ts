import { z } from 'zod'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineGlobalTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'
import { localAPIDefaults } from '../../../utils/localAPIDefaults.js'
import { whereSchema } from '../../../utils/whereSchema.js'

const DEFAULT_DESCRIPTION =
  'Count global versions in any version-enabled global by passing the global slug and optional where clause.'

export const countGlobalVersionsTool = defineGlobalTool({
  access: (args) =>
    defaultAccess(args) && Boolean(args.permissions?.globals?.[args.globalSlug]?.readVersions),
  annotations: {
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    readOnlyHint: true,
    title: 'Count Global Versions',
  },
  description: DEFAULT_DESCRIPTION,
  input: z.object({
    locale: z.string().describe('Optional: locale code to count versions in').optional(),
    where: whereSchema
      .describe(
        'Optional: where clause for filtering versions. Version document fields are usually under "version". Example: {"version.siteName":{"contains":"test"}}',
      )
      .optional(),
  }),
}).handler(async ({ authorizedMCP, globalSlug, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })
  const { locale, where } = input

  logger.info(`Counting versions for global: ${globalSlug}`)

  try {
    const result = await payload.countGlobalVersions({
      global: globalSlug,
      req,
      ...localAPIDefaults(authorizedMCP),
      ...(locale ? { locale } : {}),
      ...(where ? { where } : {}),
    })

    return {
      content: [
        {
          type: 'text',
          text: `Global "${globalSlug}" contains ${result.totalDocs} matching versions.\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
        },
      ],
      doc: result,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error counting versions for global ${globalSlug}: ${errorMessage}`)
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Error counting versions for global "${globalSlug}":** ${errorMessage}`,
        },
      ],
      isError: true,
    }
  }
})
