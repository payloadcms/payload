import type { SelectType } from 'payload'

import type { GlobalTool } from '../../../types.js'

import { getLogger } from '../../../utils/getLogger.js'
import {
  getGlobalVirtualFieldNames,
  stripVirtualFields,
} from '../../../utils/getVirtualFieldNames.js'
import { localAPIDefaults } from '../../../utils/localAPIDefaults.js'
import { prepareCollectionSchema } from '../../../utils/schemaConversion/prepareCollectionSchema.js'

const DEFAULT_DESCRIPTION = 'Update a Payload global singleton configuration.'

export const updateGlobalTool: GlobalTool = {
  description: DEFAULT_DESCRIPTION,
  handler: async ({ authorizedMCP, globalSlug, input, req }) => {
    const payload = req.payload
    const logger = getLogger({ payload })

    const { depth = 0, draft = false, fallbackLocale, locale, select, ...rest } = input

    logger.info(
      `Updating global: ${globalSlug}, draft: ${draft}${locale ? `, locale: ${locale as string}` : ''}`,
    )

    try {
      const virtualFieldNames = getGlobalVirtualFieldNames(payload.config, globalSlug)
      const parsedData = stripVirtualFields(rest as Record<string, unknown>, virtualFieldNames)

      let selectClause: SelectType | undefined
      if (select) {
        try {
          selectClause = JSON.parse(select as string) as SelectType
        } catch {
          logger.warn(`Invalid select clause JSON for global: ${String(select)}`)
          return { content: [{ type: 'text', text: 'Error: Invalid JSON in select clause' }] }
        }
      }

      const updateOptions: Parameters<typeof payload.updateGlobal>[0] = {
        slug: globalSlug,
        data: parsedData,
        depth: depth as number,
        draft: draft as boolean,
        ...localAPIDefaults(authorizedMCP),
      }

      if (locale) {
        updateOptions.locale = locale as string
      }
      if (fallbackLocale) {
        updateOptions.fallbackLocale = fallbackLocale as string
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
        content: [
          { type: 'text', text: `Error updating global "${globalSlug}": ${errorMessage}` },
        ],
      }
    }
  },
  input: ({ globalSchema }) => {
    const globalFields = prepareCollectionSchema(globalSchema)

    return {
      type: 'object',
      properties: {
        ...(globalFields.properties ?? {}),
        depth: { type: 'number', description: 'Optional: Depth of relationships to populate' },
        draft: {
          type: 'boolean',
          description: 'Optional: Whether to save as draft (default: false)',
        },
        fallbackLocale: {
          type: 'string',
          description:
            'Optional: fallback locale code to use when requested locale is not available',
        },
        locale: {
          type: 'string',
          description:
            'Optional: locale code to update data in (e.g., "en", "es"). Use "all" to update all locales for localized fields',
        },
        select: {
          type: 'string',
          description:
            'Optional: define exactly which fields you\'d like to return in the response (JSON), e.g., \'{"siteName": "My Site"}\'',
        },
      },
    }
  },
}
