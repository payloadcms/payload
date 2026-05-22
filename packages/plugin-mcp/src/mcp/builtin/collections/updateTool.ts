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

const DEFAULT_DESCRIPTION = 'Update documents in a collection by ID or where clause.'

export const updateCollectionTool = defineCollectionTool({
  description: DEFAULT_DESCRIPTION,
  input: ({ collectionSchema }) => {
    const partialSchema = prepareCollectionSchema(collectionSchema)

    // Collection updates do not require all required fields to be passed => delete .required.
    //
    // Local API equivalent: packages/payload/src/collections/operations/local/update.ts#BaseOptions#data:
    // data: DeepPartial<RequiredDataFromCollectionSlug<TSlug>>
    delete partialSchema.required

    return z.object({
      id: z.union([z.string(), z.number()]).describe('The ID of the document to update').optional(),
      data: z
        .fromJSONSchema(partialSchema as unknown as z.core.JSONSchema.JSONSchema)
        .describe('The fields to update'),
      depth: z
        .number()
        .describe('How many levels deep to populate relationships')
        .optional()
        .default(0),
      draft: z
        .boolean()
        .describe('Whether to update the document as a draft')
        .optional()
        .default(false),
      fallbackLocale: z
        .string()
        .describe('Optional: fallback locale code to use when requested locale is not available')
        .optional(),
      filePath: z.string().describe('File path for file uploads').optional(),
      locale: z
        .string()
        .describe(
          'Optional: locale code to update the document in (e.g., "en", "es"). Defaults to the default locale',
        )
        .optional(),
      overrideLock: z
        .boolean()
        .describe('Whether to override document locks')
        .optional()
        .default(true),
      overwriteExistingFiles: z
        .boolean()
        .describe('Whether to overwrite existing files')
        .optional()
        .default(false),
      select: z
        .string()
        .describe(
          'Optional: define exactly which fields you\'d like to return in the response (JSON), e.g., \'{"title": "My Post"}\'',
        )
        .optional(),
      where: z
        .string()
        .describe('JSON string for where clause to update multiple documents')
        .optional(),
    })
  },
}).handler(async ({ authorizedMCP, collectionSlug, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })

  const {
    id,
    data,
    depth,
    draft,
    fallbackLocale,
    filePath,
    locale,
    overrideLock,
    overwriteExistingFiles,
    select,
    where,
  } = input

  logger.info(
    `Updating document in collection: ${collectionSlug}${id ? ` with ID: ${id}` : ' with where clause'}, draft: ${draft}${locale ? `, locale: ${locale}` : ''}`,
  )

  try {
    if (!id && !where) {
      return {
        content: [{ type: 'text', text: 'Error: Either id or where clause must be provided' }],
      }
    }

    let parsedData = transformPointDataToPayload(data as Record<string, unknown>)
    const virtualFieldNames = getCollectionVirtualFieldNames(payload.config, collectionSlug)
    parsedData = stripVirtualFields(parsedData, virtualFieldNames)

    let whereClause: Record<string, unknown> = {}
    if (where) {
      try {
        whereClause = JSON.parse(where) as Record<string, unknown>
      } catch {
        logger.error(`Invalid where clause JSON: ${where}`)
        return { content: [{ type: 'text', text: 'Error: Invalid JSON in where clause' }] }
      }
    }

    let selectClause: SelectType | undefined
    if (select) {
      try {
        selectClause = JSON.parse(select) as SelectType
      } catch {
        logger.warn(`Invalid select clause JSON: ${select}`)
        return { content: [{ type: 'text', text: 'Error: Invalid JSON in select clause' }] }
      }
    }

    if (id) {
      const updateOptions = {
        id,
        collection: collectionSlug,
        data: parsedData,
        depth,
        draft,
        overrideLock,
        req,
        ...localAPIDefaults(authorizedMCP),
        ...(filePath ? { filePath } : {}),
        ...(overwriteExistingFiles ? { overwriteExistingFiles } : {}),
        ...(locale ? { locale } : {}),
        ...(fallbackLocale ? { fallbackLocale } : {}),
        ...(selectClause ? { select: selectClause } : {}),
      }

      const result = await payload.update(updateOptions as any)

      return {
        content: [
          {
            type: 'text',
            text: `Document updated successfully in collection "${collectionSlug}"!\nUpdated document:\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
          },
        ],
        doc: result as Record<string, unknown>,
      }
    }

    const updateOptions = {
      collection: collectionSlug,
      data: parsedData,
      depth,
      draft,
      overrideLock,
      req,
      ...localAPIDefaults(authorizedMCP),
      where: whereClause,
      ...(filePath ? { filePath } : {}),
      ...(overwriteExistingFiles ? { overwriteExistingFiles } : {}),
      ...(locale ? { locale } : {}),
      ...(fallbackLocale ? { fallbackLocale } : {}),
      ...(selectClause ? { select: selectClause } : {}),
    }

    const result = await payload.update(updateOptions as any)

    const bulkResult = result as { docs?: unknown[]; errors?: unknown[] }
    const docs = bulkResult.docs || []
    const errors = bulkResult.errors || []

    let responseText = `Multiple documents updated in collection "${collectionSlug}"!\nUpdated: ${docs.length} documents\nErrors: ${errors.length}\n---`
    if (docs.length > 0) {
      responseText += `\n\nUpdated documents:\n\`\`\`json\n${JSON.stringify(docs)}\n\`\`\``
    }
    if (errors.length > 0) {
      responseText += `\n\nErrors:\n\`\`\`json\n${JSON.stringify(errors)}\n\`\`\``
    }

    return {
      content: [{ type: 'text', text: responseText }],
      doc: { docs, errors } as unknown as Record<string, unknown>,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error updating document in ${collectionSlug}: ${errorMessage}`)
    return {
      content: [
        {
          type: 'text',
          text: `Error updating document in collection "${collectionSlug}": ${errorMessage}`,
        },
      ],
    }
  }
})
