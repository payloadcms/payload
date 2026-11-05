import { findGlobalVersionByIDInputSchema } from 'payload'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineGlobalTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'

const DEFAULT_DESCRIPTION =
  'Find a specific global version in any version-enabled global by passing the global slug and version ID.'

export const findGlobalVersionByIDTool = defineGlobalTool({
  access: (args) =>
    defaultAccess(args) && Boolean(args.permissions?.globals?.[args.slug]?.readVersions),
  annotations: {
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    readOnlyHint: true,
    title: 'Find Global Version By ID',
  },
  description: DEFAULT_DESCRIPTION,
  input: findGlobalVersionByIDInputSchema,
}).handler(async ({ slug, authorizedMCP, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })
  const { id, depth, fallbackLocale, locale, populate, select } = input

  logger.info(`Finding version for global: ${slug} with ID: ${id}`)

  try {
    const result = await payload.findGlobalVersionByID({
      id,
      slug,
      depth,
      overrideAccess: authorizedMCP.overrideAccess,
      req,
      ...(fallbackLocale !== undefined ? { fallbackLocale } : {}),
      ...(locale ? { locale } : {}),
      ...(populate ? { populate } : {}),
      ...(select ? { select } : {}),
    })

    return {
      content: [
        {
          type: 'text',
          text: `Version "${id}" from global "${slug}":\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
        },
      ],
      doc: result as unknown as Record<string, unknown>,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error finding version ${id} for global ${slug}: ${errorMessage}`)
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Error finding version "${id}" for global "${slug}":** ${errorMessage}`,
        },
      ],
      isError: true,
    }
  }
})
