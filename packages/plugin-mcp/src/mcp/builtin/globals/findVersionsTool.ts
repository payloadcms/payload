import { getPayloadOperation, invokeOperation, type PopulateType, type SelectType } from 'payload'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineGlobalTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'

const findGlobalVersionsOperation = getPayloadOperation('global', 'findVersions')

const DEFAULT_DESCRIPTION =
  'Find global versions in any version-enabled global by passing the global slug and optional where clause.'

export const findGlobalVersionsTool = defineGlobalTool({
  access: (args) =>
    defaultAccess(args) && Boolean(args.permissions?.globals?.[args.globalSlug]?.readVersions),
  annotations: {
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    readOnlyHint: true,
    title: 'Find Global Versions',
  },
  description: DEFAULT_DESCRIPTION,
  input: findGlobalVersionsOperation.input.omit({ slug: true }),
}).handler(async ({ authorizedMCP, globalSlug, input, req }) => {
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
    where,
  } = input

  logger.info(`Finding versions for global: ${globalSlug}, limit: ${limit}, page: ${page}`)

  try {
    const result = await invokeOperation(findGlobalVersionsOperation, {
      context: payload,
      input: {
        slug: globalSlug,
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
        ...(where ? { where } : {}),
      },
    })

    return {
      content: [
        {
          type: 'text',
          text: `Versions for global "${globalSlug}":\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
        },
      ],
      doc: result as unknown as Record<string, unknown>,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error finding versions for global ${globalSlug}: ${errorMessage}`)
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Error finding versions for global "${globalSlug}":** ${errorMessage}`,
        },
      ],
      isError: true,
    }
  }
})
