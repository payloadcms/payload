import type { PopulateType, SelectType } from 'payload'

import { z } from 'zod'

import { defineGlobalTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'
import { localAPIDefaults } from '../../../utils/localAPIDefaults.js'

const DEFAULT_DESCRIPTION =
  'Find a specific global version in any version-enabled global by passing the global slug and version ID.'

export const findGlobalVersionByIDTool = defineGlobalTool({
  annotations: {
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    readOnlyHint: true,
    title: 'Find Global Version By ID',
  },
  description: DEFAULT_DESCRIPTION,
  input: z.object({
    id: z.string().describe('The ID of the global version to retrieve'),
    depth: z
      .number()
      .int()
      .min(0)
      .max(10)
      .describe('How many levels deep to populate relationships in the global version document')
      .optional()
      .default(0),
    fallbackLocale: z
      .string()
      .describe('Optional: fallback locale code to use when requested locale is not available')
      .optional(),
    locale: z
      .string()
      .describe(
        'Optional: locale code to retrieve data in (e.g., "en", "es"). Use "all" to retrieve all locales for localized fields',
      )
      .optional(),
    populate: z
      .record(z.string(), z.unknown())
      .describe(
        'Optional: control which fields to include from populated relationship or upload documents.',
      )
      .optional(),
    select: z
      .record(z.string(), z.unknown())
      .describe(
        'Optional: define exactly which fields you\'d like to return in the response, e.g., {"version.siteName": true}',
      )
      .optional(),
    showHiddenFields: z
      .boolean()
      .describe('Optional: include hidden fields in the returned global version document')
      .optional(),
  }),
}).handler(async ({ authorizedMCP, globalSlug, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })
  const { id, depth, fallbackLocale, locale, populate, select, showHiddenFields } = input

  logger.info(`Finding version for global: ${globalSlug} with ID: ${id}`)

  try {
    const result = await payload.findGlobalVersionByID({
      id,
      slug: globalSlug,
      depth,
      req,
      ...localAPIDefaults(authorizedMCP),
      ...(fallbackLocale ? { fallbackLocale } : {}),
      ...(locale ? { locale } : {}),
      ...(populate ? { populate: populate as PopulateType } : {}),
      ...(select ? { select: select as SelectType } : {}),
      ...(showHiddenFields !== undefined ? { showHiddenFields } : {}),
    })

    return {
      content: [
        {
          type: 'text',
          text: `Version "${id}" from global "${globalSlug}":\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
        },
      ],
      doc: result as unknown as Record<string, unknown>,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error finding version ${id} for global ${globalSlug}: ${errorMessage}`)
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Error finding version "${id}" for global "${globalSlug}":** ${errorMessage}`,
        },
      ],
      isError: true,
    }
  }
})
