import { restoreVersionInputSchema } from 'payload'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineCollectionTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'

const DEFAULT_DESCRIPTION =
  'Restore a document from a previous version in any version-enabled collection.'

export const restoreVersionTool = defineCollectionTool({
  access: (args) =>
    defaultAccess(args) && Boolean(args.permissions?.collections?.[args.slug]?.update),
  annotations: {
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
    readOnlyHint: false,
    title: 'Restore Version',
  },
  description: DEFAULT_DESCRIPTION,
  input: restoreVersionInputSchema,
}).handler(async ({ slug, authorizedMCP, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })
  const { id, depth, draft, fallbackLocale, locale, populate, select } = input

  logger.info(`Restoring version in collection: ${slug} with ID: ${id}`)

  try {
    const result = await payload.restoreVersion({
      id: String(id),
      collection: slug,
      depth,
      draft,
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
          text: `Version "${id}" restored successfully in collection "${slug}"!\nRestored document:\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
        },
      ],
      doc: result as Record<string, unknown>,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error restoring version ${id} in ${slug}: ${errorMessage}`)
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Error restoring version "${id}" in collection "${slug}":** ${errorMessage}`,
        },
      ],
      isError: true,
    }
  }
})
