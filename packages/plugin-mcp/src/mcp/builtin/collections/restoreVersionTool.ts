import type { PopulateType, SelectType } from 'payload'

import { z } from 'zod'

import { defineCollectionTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'
import { localAPIDefaults } from '../../../utils/localAPIDefaults.js'

const DEFAULT_DESCRIPTION =
  'Restore a document from a previous version in any version-enabled collection.'

export const restoreVersionTool = defineCollectionTool({
  annotations: {
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
    readOnlyHint: false,
    title: 'Restore Version',
  },
  description: DEFAULT_DESCRIPTION,
  input: z.object({
    id: z.string().describe('The ID of the version to restore'),
    depth: z
      .number()
      .int()
      .min(0)
      .max(10)
      .describe('How many levels deep to populate relationships in response')
      .optional()
      .default(0),
    draft: z
      .boolean()
      .describe('Whether to restore the version as a draft')
      .optional()
      .default(false),
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
    select: z
      .record(z.string(), z.unknown())
      .describe(
        'Optional: define exactly which fields you\'d like to return in the response, e.g., {"title": true}',
      )
      .optional(),
    showHiddenFields: z
      .boolean()
      .describe('Optional: include hidden fields in the restored document response')
      .optional(),
  }),
}).handler(async ({ authorizedMCP, collectionSlug, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })
  const { id, depth, draft, fallbackLocale, locale, populate, select, showHiddenFields } = input

  logger.info(`Restoring version in collection: ${collectionSlug} with ID: ${id}`)

  try {
    const result = await payload.restoreVersion({
      id,
      collection: collectionSlug,
      depth,
      draft,
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
          text: `Version "${id}" restored successfully in collection "${collectionSlug}"!\nRestored document:\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
        },
      ],
      doc: result as Record<string, unknown>,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error restoring version ${id} in ${collectionSlug}: ${errorMessage}`)
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Error restoring version "${id}" in collection "${collectionSlug}":** ${errorMessage}`,
        },
      ],
      isError: true,
    }
  }
})
