import type { PopulateType, SelectType } from 'payload'

import { z } from 'zod'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineCollectionTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'
import { whereSchema } from '../../../utils/whereSchema.js'

const DEFAULT_DESCRIPTION =
  'Find document versions in any version-enabled collection by passing the collection slug and optional where clause.'

export const findVersionsTool = defineCollectionTool({
  access: (args) =>
    defaultAccess(args) &&
    Boolean(args.permissions?.collections?.[args.collectionSlug]?.readVersions),
  annotations: {
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    readOnlyHint: true,
    title: 'Find Versions',
  },
  description: DEFAULT_DESCRIPTION,
  input: z.object({
    depth: z
      .number()
      .int()
      .min(0)
      .max(10)
      .describe('How many levels deep to populate relationships in version documents')
      .optional()
      .default(0),
    fallbackLocale: z
      .string()
      .describe('Optional: fallback locale code to use when requested locale is not available')
      .optional(),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .describe('Maximum number of versions to return (default: 10, max: 100)')
      .optional()
      .default(10),
    locale: z
      .string()
      .describe(
        'Optional: locale code to retrieve data in (e.g., "en", "es"). Use "all" to retrieve all locales for localized fields',
      )
      .optional(),
    page: z
      .number()
      .int()
      .min(1)
      .describe('Page number for pagination (default: 1)')
      .optional()
      .default(1),
    pagination: z
      .boolean()
      .describe('Optional: set to false to skip the count query overhead')
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
        'Optional: define exactly which fields you\'d like to return in the response, e.g., {"version.title": true}',
      )
      .optional(),
    showHiddenFields: z
      .boolean()
      .describe('Optional: include hidden fields in returned version documents')
      .optional(),
    sort: z
      .string()
      .describe('Field to sort by (e.g., "-updatedAt", "-version.updatedAt" for descending)')
      .optional(),
    trash: z
      .boolean()
      .describe('Optional: include versions for soft-deleted documents when trash is enabled')
      .optional(),
    where: whereSchema
      .describe(
        'Optional: where clause for filtering versions. Version document fields are usually under "version". Example: {"version.title":{"contains":"test"}}',
      )
      .optional(),
  }),
}).handler(async ({ authorizedMCP, collectionSlug, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })
  const {
    depth,
    fallbackLocale,
    limit,
    locale,
    page,
    pagination,
    populate,
    select,
    showHiddenFields,
    sort,
    trash,
    where,
  } = input

  logger.info(`Finding versions in collection: ${collectionSlug}, limit: ${limit}, page: ${page}`)

  try {
    const result = await payload.findVersions({
      collection: collectionSlug,
      depth,
      limit,
      overrideAccess: authorizedMCP.overrideAccess,
      page,
      req,
      ...(fallbackLocale ? { fallbackLocale } : {}),
      ...(locale ? { locale } : {}),
      ...(pagination !== undefined ? { pagination } : {}),
      ...(populate ? { populate: populate as PopulateType } : {}),
      ...(select ? { select: select as SelectType } : {}),
      ...(showHiddenFields !== undefined ? { showHiddenFields } : {}),
      ...(sort ? { sort } : {}),
      ...(trash !== undefined ? { trash } : {}),
      ...(where ? { where } : {}),
    })

    return {
      content: [
        {
          type: 'text',
          text: `Versions for collection "${collectionSlug}":\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
        },
      ],
      doc: result as unknown as Record<string, unknown>,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error finding versions in ${collectionSlug}: ${errorMessage}`)
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Error finding versions in collection "${collectionSlug}":** ${errorMessage}`,
        },
      ],
      isError: true,
    }
  }
})
