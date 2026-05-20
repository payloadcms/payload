import type { SelectType } from 'payload'

import type { CollectionTool } from '../../../types.js'

import { getLogger } from '../../../utils/getLogger.js'
import {
  getCollectionVirtualFieldNames,
  stripVirtualFields,
} from '../../../utils/getVirtualFieldNames.js'
import { localAPIDefaults } from '../../../utils/localAPIDefaults.js'
import { prepareCollectionSchema } from '../../../utils/schemaConversion/prepareCollectionSchema.js'
import { transformPointDataToPayload } from '../../../utils/transformPointDataToPayload.js'

const DEFAULT_DESCRIPTION = 'Create a document in a collection.'

export const createCollectionTool: CollectionTool = {
  description: DEFAULT_DESCRIPTION,
  handler: async ({ authorizedMCP, collectionSlug, input, req }) => {
    const payload = req.payload
    const logger = getLogger({ payload })

    const { depth, draft, fallbackLocale, locale, select, ...fieldData } = input

    logger.info(
      `Creating document in collection: ${collectionSlug}${locale ? ` with locale: ${locale}` : ''}`,
    )

    try {
      let parsedData = transformPointDataToPayload(fieldData as Record<string, unknown>)
      const virtualFieldNames = getCollectionVirtualFieldNames(payload.config, collectionSlug)
      parsedData = stripVirtualFields(parsedData, virtualFieldNames)

      let selectClause: SelectType | undefined
      if (select) {
        try {
          selectClause = JSON.parse(select as string) as SelectType
        } catch {
          logger.warn(`Invalid select clause JSON: ${String(select)}`)
          return { content: [{ type: 'text', text: 'Error: Invalid JSON in select clause' }] }
        }
      }

      const result = await payload.create({
        collection: collectionSlug,
        data: parsedData,
        depth: depth as number,
        draft: draft as boolean,
        req,
        ...localAPIDefaults(authorizedMCP),
        ...(locale ? { locale: locale as string } : {}),
        ...(fallbackLocale ? { fallbackLocale: fallbackLocale as string } : {}),
        ...(selectClause ? { select: selectClause } : {}),
      })

      logger.info(`Successfully created document in ${collectionSlug} with ID: ${result.id}`)

      return {
        content: [
          {
            type: 'text',
            text: `Document created successfully in collection "${collectionSlug}"!\nCreated document:\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
          },
        ],
        doc: result as Record<string, unknown>,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`Error creating document in ${collectionSlug}: ${errorMessage}`)
      return {
        content: [
          {
            type: 'text',
            text: `Error creating document in collection "${collectionSlug}": ${errorMessage}`,
          },
        ],
      }
    }
  },
  input: ({ collectionSchema }) => {
    const collectionFields = prepareCollectionSchema(collectionSchema)

    return {
      type: 'object',
      properties: {
        ...(collectionFields.properties ?? {}),
        depth: {
          type: 'integer',
          default: 0,
          description: 'How many levels deep to populate relationships in response',
          maximum: 10,
          minimum: 0,
        },
        draft: {
          type: 'boolean',
          default: false,
          description: 'Whether to create the document as a draft',
        },
        fallbackLocale: {
          type: 'string',
          description:
            'Optional: fallback locale code to use when requested locale is not available',
        },
        locale: {
          type: 'string',
          description:
            'Optional: locale code to create the document in (e.g., "en", "es"). Defaults to the default locale',
        },
        select: {
          type: 'string',
          description:
            'Optional: define exactly which fields you\'d like to create (JSON), e.g., \'{"title": "My Post"}\'',
        },
      },
      ...(collectionFields.required ? { required: collectionFields.required } : {}),
    }
  },
}
