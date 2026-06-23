import type { PopulateType } from 'payload'

import { z } from 'zod'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineGlobalTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'
import { localAPIDefaults } from '../../../utils/localAPIDefaults.js'

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
  input: z.object({
    id: z.string().describe('The ID of the global version to restore'),
    depth: z
      .number()
      .int()
      .min(0)
      .max(10)
      .describe('How many levels deep to populate relationships in response')
      .optional()
      .default(0),
    fallbackLocale: z
      .string()
      .describe('Optional: fallback locale code to use when requested locale is not available')
      .optional(),
    locale: z
      .string()
      .describe('Optional: locale code to restore in (e.g., "en", "es")')
      .optional(),
    populate: z
      .record(z.string(), z.unknown())
      .describe(
        'Optional: control which fields to include from populated relationship or upload documents.',
      )
      .optional(),
    showHiddenFields: z
      .boolean()
      .describe('Optional: include hidden fields in the restored global response')
      .optional(),
  }),
}).handler(async ({ authorizedMCP, globalSlug, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })
  const { id, depth, fallbackLocale, locale, populate, showHiddenFields } = input

  logger.info(`Restoring version for global: ${globalSlug} with ID: ${id}`)

  try {
    const result = await payload.restoreGlobalVersion({
      id,
      slug: globalSlug,
      depth,
      req,
      ...localAPIDefaults(authorizedMCP),
      ...(fallbackLocale ? { fallbackLocale } : {}),
      ...(locale ? { locale } : {}),
      ...(populate ? { populate: populate as PopulateType } : {}),
      ...(showHiddenFields !== undefined ? { showHiddenFields } : {}),
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
