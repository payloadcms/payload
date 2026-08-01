import { getPayloadOperation, invokeOperation, type PopulateType, type SelectType } from 'payload'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineGlobalTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'

const findGlobalOperation = getPayloadOperation('global', 'find')

const DEFAULT_DESCRIPTION = 'Find any Payload global by passing the global slug.'

export const findGlobalTool = defineGlobalTool({
  access: (args) =>
    defaultAccess(args) && Boolean(args.permissions?.globals?.[args.globalSlug]?.read),
  annotations: {
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    readOnlyHint: true,
    title: 'Find Global',
  },
  description: DEFAULT_DESCRIPTION,
  input: findGlobalOperation.input.omit({ slug: true }),
}).handler(async ({ authorizedMCP, globalSlug, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })

  const { depth, fallbackLocale, locale, populate, select } = input

  logger.info(
    `Reading global: ${globalSlug}, depth: ${depth}${locale ? `, locale: ${locale}` : ''}`,
  )

  try {
    const findOptions: Parameters<typeof payload.findGlobal>[0] = {
      slug: globalSlug,
      depth,
      overrideAccess: authorizedMCP.overrideAccess,
      req,
    }

    if (locale) {
      findOptions.locale = locale
    }
    if (fallbackLocale) {
      findOptions.fallbackLocale = fallbackLocale
    }
    if (select) {
      findOptions.select = select as SelectType
    }
    if (populate) {
      findOptions.populate = populate as PopulateType
    }

    const result = await invokeOperation(findGlobalOperation, {
      context: payload,
      input: findOptions as never,
    })

    return {
      content: [
        {
          type: 'text',
          text: `Global "${globalSlug}":\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
        },
      ],
      doc: result as Record<string, unknown>,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error reading global ${globalSlug}: ${errorMessage}`)
    return {
      content: [
        { type: 'text', text: `❌ **Error reading global "${globalSlug}":** ${errorMessage}` },
      ],
    }
  }
})
