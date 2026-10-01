import { findGlobalInputSchema } from 'payload'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineGlobalTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'

const DEFAULT_DESCRIPTION = 'Find any Payload global by passing the global slug.'

export const findGlobalTool = defineGlobalTool({
  access: (args) => defaultAccess(args) && Boolean(args.permissions?.globals?.[args.slug]?.read),
  annotations: {
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    readOnlyHint: true,
    title: 'Find Global',
  },
  description: DEFAULT_DESCRIPTION,
  input: findGlobalInputSchema,
}).handler(async ({ slug, authorizedMCP, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })

  const { depth, fallbackLocale, locale, populate, select } = input

  logger.info(`Reading global: ${slug}, depth: ${depth}${locale ? `, locale: ${locale}` : ''}`)

  try {
    const findOptions: Parameters<typeof payload.findGlobal>[0] = {
      slug,
      depth,
      overrideAccess: authorizedMCP.overrideAccess,
      req,
    }

    if (locale) {
      findOptions.locale = locale
    }
    if (fallbackLocale !== undefined) {
      findOptions.fallbackLocale = fallbackLocale
    }
    if (select) {
      findOptions.select = select
    }
    if (populate) {
      findOptions.populate = populate
    }
    const result = await payload.findGlobal(findOptions)

    return {
      content: [
        {
          type: 'text',
          text: `Global "${slug}":\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
        },
      ],
      doc: result as Record<string, unknown>,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error reading global ${slug}: ${errorMessage}`)
    return {
      content: [{ type: 'text', text: `❌ **Error reading global "${slug}":** ${errorMessage}` }],
    }
  }
})
