import { restoreGlobalVersionInputSchema } from 'payload'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineGlobalTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'

const DEFAULT_DESCRIPTION =
  'Restore a global from a previous version in any version-enabled global.'

export const restoreGlobalVersionTool = defineGlobalTool({
  access: (args) => defaultAccess(args) && Boolean(args.permissions?.globals?.[args.slug]?.update),
  annotations: {
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
    readOnlyHint: false,
    title: 'Restore Global Version',
  },
  description: DEFAULT_DESCRIPTION,
  input: restoreGlobalVersionInputSchema,
}).handler(async ({ slug, authorizedMCP, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })
  const { id, depth, fallbackLocale, locale, populate, select } = input

  logger.info(`Restoring version for global: ${slug} with ID: ${id}`)

  try {
    const result = await payload.restoreGlobalVersion({
      id: String(id),
      slug,
      depth,
      overrideAccess: authorizedMCP.overrideAccess,
      req,
      ...(fallbackLocale !== undefined ? { fallbackLocale } : {}),
      ...(locale ? { locale } : {}),
      ...(populate ? { populate } : {}),
      ...(select ? { select } : {}),
    })
    const resultObject = result as Record<string, unknown>
    const restoredGlobal =
      resultObject.version && typeof resultObject.version === 'object'
        ? (resultObject.version as Record<string, unknown>)
        : resultObject

    return {
      content: [
        {
          type: 'text',
          text: `Version "${id}" restored successfully for global "${slug}"!\nRestored global:\n\`\`\`json\n${JSON.stringify(restoredGlobal)}\n\`\`\``,
        },
      ],
      doc: restoredGlobal,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error restoring version ${id} for global ${slug}: ${errorMessage}`)
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Error restoring version "${id}" for global "${slug}":** ${errorMessage}`,
        },
      ],
      isError: true,
    }
  }
})
