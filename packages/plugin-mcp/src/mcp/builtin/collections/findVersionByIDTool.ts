import { findVersionByIDInputSchema } from 'payload'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineCollectionTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'

const DEFAULT_DESCRIPTION =
  'Find a specific document version in any version-enabled collection by passing the collection slug and version ID.'

export const findVersionByIDTool = defineCollectionTool({
  access: (args) =>
    defaultAccess(args) && Boolean(args.permissions?.collections?.[args.slug]?.readVersions),
  annotations: {
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    readOnlyHint: true,
    title: 'Find Version By ID',
  },
  description: DEFAULT_DESCRIPTION,
  input: findVersionByIDInputSchema,
}).handler(async ({ slug, authorizedMCP, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })
  const { id, depth, draft, fallbackLocale, locale, populate, select, trash } = input

  logger.info(`Finding version in collection: ${slug} with ID: ${id}`)

  try {
    const result = await payload.findVersionByID({
      id: String(id),
      collection: slug,
      depth,
      overrideAccess: authorizedMCP.overrideAccess,
      req,
      ...(draft !== undefined ? { draft } : {}),
      ...(fallbackLocale !== undefined ? { fallbackLocale } : {}),
      ...(locale ? { locale } : {}),
      ...(populate ? { populate } : {}),
      ...(select ? { select } : {}),
      ...(trash !== undefined ? { trash } : {}),
    })

    return {
      content: [
        {
          type: 'text',
          text: `Version "${id}" from collection "${slug}":\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
        },
      ],
      doc: result as unknown as Record<string, unknown>,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error finding version ${id} in ${slug}: ${errorMessage}`)
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Error finding version "${id}" in collection "${slug}":** ${errorMessage}`,
        },
      ],
      isError: true,
    }
  }
})
