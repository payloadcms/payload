import type { SelectType } from 'payload'

import { z } from 'zod'

import { defineCollectionTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'
import {
  getCollectionVirtualFieldNames,
  stripVirtualFields,
} from '../../../utils/getVirtualFieldNames.js'
import { localAPIDefaults } from '../../../utils/localAPIDefaults.js'
import { prepareCollectionSchema } from '../../../utils/schemaConversion/prepareCollectionSchema.js'
import { transformPointDataToPayload } from '../../../utils/transformPointDataToPayload.js'

const DEFAULT_DESCRIPTION = 'Create a document in a collection.'

export const createCollectionTool = defineCollectionTool({
  description: DEFAULT_DESCRIPTION,
  input: ({ collectionSchema }) =>
    z.object({
      data: z
        .fromJSONSchema(
          prepareCollectionSchema(collectionSchema) as unknown as z.core.JSONSchema.JSONSchema,
        )
        .describe('The document fields to create'),
      depth: z
        .number()
        .int()
        .min(0)
        .max(10)
        .describe('How many levels deep to populate relationships in response')
        .optional()
        .default(0),
      draft: z
        .boolean()
        .describe('Whether to create the document as a draft')
        .optional()
        .default(false),
      fallbackLocale: z
        .string()
        .describe('Optional: fallback locale code to use when requested locale is not available')
        .optional(),
      locale: z
        .string()
        .describe(
          'Optional: locale code to create the document in (e.g., "en", "es"). Defaults to the default locale',
        )
        .optional(),
      select: z
        .string()
        .describe(
          'Optional: define exactly which fields you\'d like to create (JSON), e.g., \'{"title": "My Post"}\'',
        )
        .optional(),
    }),
}).handler(async ({ authorizedMCP, collectionSlug, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })

  const { data, depth, draft, fallbackLocale, locale, select } = input

  logger.info(
    `Creating document in collection: ${collectionSlug}${locale ? ` with locale: ${locale}` : ''}`,
  )

  try {
    let parsedData = transformPointDataToPayload(data as Record<string, unknown>)
    const virtualFieldNames = getCollectionVirtualFieldNames(payload.config, collectionSlug)
    parsedData = stripVirtualFields(parsedData, virtualFieldNames)

    let selectClause: SelectType | undefined
    if (select) {
      try {
        selectClause = JSON.parse(select) as SelectType
      } catch {
        logger.warn(`Invalid select clause JSON: ${select}`)
        return { content: [{ type: 'text', text: 'Error: Invalid JSON in select clause' }] }
      }
    }

    const result = await payload.create({
      collection: collectionSlug,
      data: parsedData,
      depth,
      draft,
      req,
      ...localAPIDefaults(authorizedMCP),
      ...(locale ? { locale } : {}),
      ...(fallbackLocale ? { fallbackLocale } : {}),
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
      doc: result,
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
})
