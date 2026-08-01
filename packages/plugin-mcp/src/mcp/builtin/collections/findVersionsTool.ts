import { getPayloadOperation, invokeOperation, type PopulateType, type SelectType } from 'payload'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineCollectionTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'

const findVersionsOperation = getPayloadOperation('collection', 'findVersions')

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
  input: findVersionsOperation.input.omit({ collection: true }),
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
    const result = await invokeOperation(findVersionsOperation, {
      context: payload,
      input: {
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
      },
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
