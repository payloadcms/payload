import { findVersionsInputSchema } from 'payload'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineCollectionTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'

const DEFAULT_DESCRIPTION =
  'Find document versions in any version-enabled collection by passing the collection slug and optional where clause.'

export const findVersionsTool = defineCollectionTool({
  access: (args) =>
    defaultAccess(args) && Boolean(args.permissions?.collections?.[args.slug]?.readVersions),
  annotations: {
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    readOnlyHint: true,
    title: 'Find Versions',
  },
  description: DEFAULT_DESCRIPTION,
  input: findVersionsInputSchema,
}).handler(async ({ slug, authorizedMCP, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })
  const {
    depth,
    draft,
    fallbackLocale,
    limit,
    locale,
    page,
    pagination,
    populate,
    select,
    sort,
    trash,
    where,
  } = input

  logger.info(`Finding versions in collection: ${slug}, limit: ${limit}, page: ${page}`)

  try {
    const result = await payload.findVersions({
      collection: slug,
      depth,
      limit,
      overrideAccess: authorizedMCP.overrideAccess,
      page,
      req,
      ...(draft !== undefined ? { draft } : {}),
      ...(fallbackLocale !== undefined ? { fallbackLocale } : {}),
      ...(locale ? { locale } : {}),
      ...(pagination !== undefined ? { pagination } : {}),
      ...(populate ? { populate } : {}),
      ...(select ? { select } : {}),
      ...(sort ? { sort } : {}),
      ...(trash !== undefined ? { trash } : {}),
      ...(where ? { where } : {}),
    })

    return {
      content: [
        {
          type: 'text',
          text: `Versions for collection "${slug}":\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
        },
      ],
      doc: result as unknown as Record<string, unknown>,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error finding versions in ${slug}: ${errorMessage}`)
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Error finding versions in collection "${slug}":** ${errorMessage}`,
        },
      ],
      isError: true,
    }
  }
})
