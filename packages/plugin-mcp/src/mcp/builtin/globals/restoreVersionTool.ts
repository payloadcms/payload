import { getPayloadOperation, invokeOperation, type PopulateType } from 'payload'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineGlobalTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'

const restoreGlobalVersionOperation = getPayloadOperation('global', 'restoreVersion')

const DEFAULT_DESCRIPTION =
  'Restore a global from a previous version in any version-enabled global.'

export const restoreGlobalVersionTool = defineGlobalTool({
  access: (args) =>
    defaultAccess(args) && Boolean(args.permissions?.globals?.[args.globalSlug]?.update),
  annotations: {
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
    readOnlyHint: false,
    title: 'Restore Global Version',
  },
  description: DEFAULT_DESCRIPTION,
  input: restoreGlobalVersionOperation.input.omit({ slug: true }),
}).handler(async ({ authorizedMCP, globalSlug, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })
  const { id, depth, fallbackLocale, locale, populate, showHiddenFields } = input

  logger.info(`Restoring version for global: ${globalSlug} with ID: ${id}`)

  try {
    const result = await invokeOperation(restoreGlobalVersionOperation, {
      context: payload,
      input: {
        id,
        slug: globalSlug,
        depth,
        overrideAccess: authorizedMCP.overrideAccess,
        req,
        ...(fallbackLocale ? { fallbackLocale } : {}),
        ...(locale ? { locale } : {}),
        ...(populate ? { populate: populate as PopulateType } : {}),
        ...(showHiddenFields !== undefined ? { showHiddenFields } : {}),
      },
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
          text: `Version "${id}" restored successfully for global "${globalSlug}"!\nRestored global:\n\`\`\`json\n${JSON.stringify(restoredGlobal)}\n\`\`\``,
        },
      ],
      doc: restoredGlobal,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error restoring version ${id} for global ${globalSlug}: ${errorMessage}`)
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Error restoring version "${id}" for global "${globalSlug}":** ${errorMessage}`,
        },
      ],
      isError: true,
    }
  }
})
