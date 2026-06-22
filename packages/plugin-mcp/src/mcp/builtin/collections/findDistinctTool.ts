import type { PopulateType } from 'payload'

import { z } from 'zod'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineCollectionTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'
import { localAPIDefaults } from '../../../utils/localAPIDefaults.js'
import { whereSchema } from '../../../utils/whereSchema.js'

const DEFAULT_DESCRIPTION =
  'Find distinct values for a field in any collection by passing the collection slug and field path.'

export const findDistinctTool = defineCollectionTool({
  access: (args) =>
    defaultAccess(args) && Boolean(args.permissions?.collections?.[args.collectionSlug]?.read),
  annotations: {
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    readOnlyHint: true,
    title: 'Find Distinct',
  },
  description: DEFAULT_DESCRIPTION,
  input: z.object({
    depth: z
      .number()
      .int()
      .min(0)
      .max(10)
      .describe('How many levels deep to populate relationships in distinct values')
      .optional()
      .default(0),
    field: z.string().describe('The field path to get distinct values for'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .describe('Maximum number of distinct values to return (max: 100)')
      .optional(),
    locale: z
      .string()
      .describe(
        'Optional: locale code to retrieve data in (e.g., "en", "es"). Use "all" to retrieve all locales for localized fields',
      )
      .optional(),
    page: z.number().int().min(1).describe('Page number for pagination').optional(),
    populate: z
      .record(z.string(), z.unknown())
      .describe(
        'Optional: control which fields to include from populated relationship or upload documents.',
      )
      .optional(),
    showHiddenFields: z
      .boolean()
      .describe('Optional: include hidden fields in the distinct query')
      .optional(),
    sort: z
      .string()
      .describe('Field to sort by (e.g., "createdAt", "-updatedAt" for descending)')
      .optional(),
    trash: z
      .boolean()
      .describe('Optional: include soft-deleted documents when trash is enabled on the collection')
      .optional(),
    where: whereSchema
      .describe(
        'Optional: where clause for filtering. Use field names with Payload operators, and/or arrays for grouping. Example: {"title":{"contains":"test"}}',
      )
      .optional(),
  }),
}).handler(async ({ authorizedMCP, collectionSlug, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })
  const { depth, field, limit, locale, page, populate, showHiddenFields, sort, trash, where } = input

  logger.info(`Finding distinct values in collection: ${collectionSlug}, field: ${field}`)

  try {
    const result = await payload.findDistinct({
      collection: collectionSlug,
      depth,
      field,
      req,
      ...localAPIDefaults(authorizedMCP),
      ...(limit ? { limit } : {}),
      ...(locale ? { locale } : {}),
      ...(page ? { page } : {}),
      ...(populate ? { populate: populate as PopulateType } : {}),
      ...(showHiddenFields !== undefined ? { showHiddenFields } : {}),
      ...(sort ? { sort } : {}),
      ...(trash !== undefined ? { trash } : {}),
      ...(where ? { where } : {}),
    })

    return {
      content: [
        {
          type: 'text',
          text: `Distinct values for "${field}" in collection "${collectionSlug}":\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
        },
      ],
      doc: result as unknown as Record<string, unknown>,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error finding distinct values in ${collectionSlug}: ${errorMessage}`)
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Error finding distinct values in collection "${collectionSlug}":** ${errorMessage}`,
        },
      ],
      isError: true,
    }
  }
})
