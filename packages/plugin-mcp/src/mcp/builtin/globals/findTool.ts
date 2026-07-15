import type { PopulateType, SelectType } from 'payload'

import { z } from 'zod'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineGlobalTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'

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
  input: z.object({
    depth: z
      .number()
      .int()
      .min(0)
      .max(10)
      .describe('Depth of population for relationships')
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
        'Optional: define exactly which fields you\'d like to return in the response, e.g., {"title": true}',
      )
      .optional(),
  }),
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

    const result = await payload.findGlobal(findOptions)

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
