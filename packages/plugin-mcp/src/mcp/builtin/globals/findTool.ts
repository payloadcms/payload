import type { SelectType } from 'payload'
import { z } from 'zod'

import { defineGlobalTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'
import { localAPIDefaults } from '../../../utils/localAPIDefaults.js'

const DEFAULT_DESCRIPTION = 'Find a Payload global singleton configuration.'

export const findGlobalTool = defineGlobalTool({
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
    select: z
      .string()
      .describe(
        "Optional: define exactly which fields you'd like to return in the response (JSON), e.g., '{\"title\": true}'",
      )
      .optional(),
  }),
}).handler(async ({ authorizedMCP, globalSlug, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })

  const { depth, locale, fallbackLocale, select } = input

  logger.info(
    `Reading global: ${globalSlug}, depth: ${depth}${locale ? `, locale: ${locale}` : ''}`,
  )

  try {
    const findOptions: Parameters<typeof payload.findGlobal>[0] = {
      slug: globalSlug,
      depth,
      ...localAPIDefaults(authorizedMCP),
    }

    let selectClause: SelectType | undefined
    if (select) {
      try {
        selectClause = JSON.parse(select) as SelectType
      } catch {
        logger.warn(`Invalid select clause JSON for global: ${select}`)
        return { content: [{ type: 'text', text: 'Error: Invalid JSON in select clause' }] }
      }
    }

    if (locale) {
      findOptions.locale = locale
    }
    if (fallbackLocale) {
      findOptions.fallbackLocale = fallbackLocale
    }
    if (selectClause) {
      findOptions.select = selectClause
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
