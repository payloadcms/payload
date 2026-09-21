import { findGlobalVersionsInputSchema } from 'payload'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineGlobalTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'

const DEFAULT_DESCRIPTION =
  'Find global versions in any version-enabled global by passing the global slug and optional where clause.'

export const findGlobalVersionsTool = defineGlobalTool({
  access: (args) =>
    defaultAccess(args) && Boolean(args.permissions?.globals?.[args.slug]?.readVersions),
  annotations: {
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    readOnlyHint: true,
    title: 'Find Global Versions',
  },
  description: DEFAULT_DESCRIPTION,
  input: findGlobalVersionsInputSchema,
}).handler(async ({ slug, authorizedMCP, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })
  const { depth, fallbackLocale, limit, locale, page, pagination, populate, select, sort, where } =
    input

  logger.info(`Finding versions for global: ${slug}, limit: ${limit}, page: ${page}`)

  try {
    const result = await payload.findGlobalVersions({
      slug,
      depth,
      limit,
      overrideAccess: authorizedMCP.overrideAccess,
      page,
      req,
      ...(fallbackLocale !== undefined ? { fallbackLocale } : {}),
      ...(locale ? { locale } : {}),
      ...(pagination !== undefined ? { pagination } : {}),
      ...(populate ? { populate } : {}),
      ...(select ? { select } : {}),
      ...(sort ? { sort } : {}),
      ...(where ? { where } : {}),
    })

    return {
      content: [
        {
          type: 'text',
          text: `Versions for global "${slug}":\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
        },
      ],
      doc: result as unknown as Record<string, unknown>,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error finding versions for global ${slug}: ${errorMessage}`)
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Error finding versions for global "${slug}":** ${errorMessage}`,
        },
      ],
      isError: true,
    }
  }
})
