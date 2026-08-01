import { getPayloadOperation, invokeOperation, type PopulateType, type SelectType } from 'payload'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineGlobalTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'

const findGlobalVersionByIDOperation = getPayloadOperation('global', 'findVersionByID')

const DEFAULT_DESCRIPTION =
  'Find a specific global version in any version-enabled global by passing the global slug and version ID.'

export const findGlobalVersionByIDTool = defineGlobalTool({
  access: (args) =>
    defaultAccess(args) && Boolean(args.permissions?.globals?.[args.globalSlug]?.readVersions),
  annotations: {
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    readOnlyHint: true,
    title: 'Find Global Version By ID',
  },
  description: DEFAULT_DESCRIPTION,
  input: findGlobalVersionByIDOperation.input.omit({ slug: true }),
}).handler(async ({ authorizedMCP, globalSlug, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })
  const { id, depth, fallbackLocale, locale, populate, select, showHiddenFields } = input

  logger.info(`Finding version for global: ${globalSlug} with ID: ${id}`)

  try {
    const result = await invokeOperation(findGlobalVersionByIDOperation, {
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
        ...(select ? { select: select as SelectType } : {}),
        ...(showHiddenFields !== undefined ? { showHiddenFields } : {}),
      },
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
