import { fromJsonSchema } from '@modelcontextprotocol/server'
import type { SelectType } from 'payload'
import { z } from 'zod'

import { defineGlobalTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'
import {
  getGlobalVirtualFieldNames,
  stripVirtualFields,
} from '../../../utils/getVirtualFieldNames.js'
import { localAPIDefaults } from '../../../utils/localAPIDefaults.js'
import { prepareCollectionSchema } from '../../../utils/schemaConversion/prepareCollectionSchema.js'

const DEFAULT_DESCRIPTION = 'Update a Payload global singleton configuration.'

export const updateGlobalTool = defineGlobalTool({
  description: DEFAULT_DESCRIPTION,
  input: ({ globalSchema }) =>
    z.object({
      data: fromJsonSchema({
        ...prepareCollectionSchema(globalSchema),
        description: 'The fields to update',
      }),
      depth: z
        .number()
        .describe('Optional: Depth of relationships to populate')
        .optional()
        .default(0),
      draft: z
        .boolean()
        .describe('Optional: Whether to save as draft (default: false)')
        .optional()
        .default(false),
      fallbackLocale: z
        .string()
        .describe('Optional: fallback locale code to use when requested locale is not available')
        .optional(),
      locale: z
        .string()
        .describe(
          'Optional: locale code to update data in (e.g., "en", "es"). Use "all" to update all locales for localized fields',
        )
        .optional(),
      select: z
        .string()
        .describe(
          'Optional: define exactly which fields you\'d like to return in the response (JSON), e.g., \'{"siteName": "My Site"}\'',
        )
        .optional(),
    }),
}).handler(async ({ authorizedMCP, globalSlug, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })

  const { data, depth, draft, fallbackLocale, locale, select } = input

  logger.info(
    `Updating global: ${globalSlug}, draft: ${draft}${locale ? `, locale: ${locale}` : ''}`,
  )

  try {
    const virtualFieldNames = getGlobalVirtualFieldNames(payload.config, globalSlug)
    const parsedData = stripVirtualFields(data as Record<string, unknown>, virtualFieldNames)

    let selectClause: SelectType | undefined
    if (select) {
      try {
        selectClause = JSON.parse(select) as SelectType
      } catch {
        logger.warn(`Invalid select clause JSON for global: ${select}`)
        return { content: [{ type: 'text', text: 'Error: Invalid JSON in select clause' }] }
      }
    }

    const updateOptions: Parameters<typeof payload.updateGlobal>[0] = {
      slug: globalSlug,
      data: parsedData,
      depth,
      draft,
      ...localAPIDefaults(authorizedMCP),
    }

    if (locale) {
      updateOptions.locale = locale
    }
    if (fallbackLocale) {
      updateOptions.fallbackLocale = fallbackLocale
    }
    if (selectClause) {
      updateOptions.select = selectClause
    }

    const result = await payload.updateGlobal(updateOptions)

    return {
      content: [
        {
          type: 'text',
          text: `Global "${globalSlug}" updated successfully!\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
        },
      ],
      doc: result as Record<string, unknown>,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error updating global ${globalSlug}: ${errorMessage}`)
    return {
      content: [{ type: 'text', text: `Error updating global "${globalSlug}": ${errorMessage}` }],
    }
  }
})
