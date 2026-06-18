import type { PopulateType, SelectType } from 'payload'

import { z } from 'zod'

import { defineCollectionTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'
import {
  getCollectionVirtualFieldNames,
  stripVirtualFields,
} from '../../../utils/getVirtualFieldNames.js'
import { localAPIDefaults } from '../../../utils/localAPIDefaults.js'
import { transformPointDataToPayload } from '../../../utils/transformPointDataToPayload.js'
import { formatCollectionError } from './formatCollectionError.js'

const DEFAULT_DESCRIPTION =
  'Duplicate a document in any collection by passing the collection slug and source document ID.'

export const duplicateDocumentTool = defineCollectionTool({
  annotations: {
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
    readOnlyHint: false,
    title: 'Duplicate Document',
  },
  description: DEFAULT_DESCRIPTION,
  input: z.object({
    id: z.union([z.string(), z.number()]).describe('The ID of the document to duplicate'),
    data: z
      .record(z.string(), z.unknown())
      .describe('Optional: fields to override on the duplicated document')
      .optional(),
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
      .describe('Whether to create the duplicate as a draft')
      .optional()
      .default(false),
    fallbackLocale: z
      .string()
      .describe('Optional: fallback locale code to use when requested locale is not available')
      .optional(),
    locale: z
      .string()
      .describe(
        'Optional: locale code to duplicate in (e.g., "en", "es"). Defaults to the default locale',
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
    selectedLocales: z
      .array(z.string())
      .describe('Optional: localized field locales to include in the duplicated document')
      .optional(),
    showHiddenFields: z
      .boolean()
      .describe('Optional: include hidden fields in the duplicated document response')
      .optional(),
  }),
}).handler(async ({ authorizedMCP, collectionSlug, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })
  const {
    id,
    data,
    depth,
    draft,
    fallbackLocale,
    locale,
    populate,
    select,
    selectedLocales,
    showHiddenFields,
  } = input

  logger.info(`Duplicating document in collection: ${collectionSlug} with ID: ${id}`)

  try {
    const virtualFieldNames = getCollectionVirtualFieldNames(payload.config, collectionSlug)
    const inputData = data ? stripVirtualFields(data, virtualFieldNames) : undefined
    const parsedData = inputData ? transformPointDataToPayload(inputData) : undefined

    const result = await payload.duplicate({
      id,
      collection: collectionSlug,
      depth,
      draft,
      req,
      ...localAPIDefaults(authorizedMCP),
      ...(parsedData ? { data: parsedData } : {}),
      ...(locale ? { locale } : {}),
      ...(fallbackLocale ? { fallbackLocale } : {}),
      ...(populate ? { populate: populate as PopulateType } : {}),
      ...(select ? { select: select as SelectType } : {}),
      ...(selectedLocales ? { selectedLocales } : {}),
      ...(showHiddenFields !== undefined ? { showHiddenFields } : {}),
    })

    logger.info(`Successfully duplicated document in ${collectionSlug} from ID: ${id}`)

    return {
      content: [
        {
          type: 'text',
          text: `Document duplicated successfully in collection "${collectionSlug}"!\nDuplicated document:\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
        },
      ],
      doc: result as Record<string, unknown>,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error duplicating document in ${collectionSlug}: ${errorMessage}`)
    return formatCollectionError({ action: 'duplicating', collectionSlug, error, req })
  }
})
