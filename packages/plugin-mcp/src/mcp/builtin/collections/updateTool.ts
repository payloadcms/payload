import type { SelectType, Where } from 'payload'

import { z } from 'zod'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineCollectionTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'
import {
  getCollectionVirtualFieldNames,
  stripVirtualFields,
} from '../../../utils/getVirtualFieldNames.js'
import { getCollectionInputSchema } from '../../../utils/schemaConversion/getEntityInputSchema.js'
import { transformPointDataToPayload } from '../../../utils/transformPointDataToPayload.js'
import { whereSchema } from '../../../utils/whereSchema.js'
import { validateCollectionData } from '../validateEntityData.js'
import { fileInputSchema, resolveFile } from './fileInput.js'
import { formatCollectionError } from './formatCollectionError.js'

const DEFAULT_DESCRIPTION =
  'Update documents in any collection. Files can use a URL, base64, or an upload prepared by getUploadInstructions.'

export const updateDocumentTool = defineCollectionTool({
  access: (args) =>
    defaultAccess(args) && Boolean(args.permissions?.collections?.[args.collectionSlug]?.update),
  annotations: {
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
    readOnlyHint: false,
    title: 'Update Document',
  },
  description: DEFAULT_DESCRIPTION,
  input: z.object({
    id: z.union([z.string(), z.number()]).describe('The ID of the document to update').optional(),
    data: z
      .record(z.string(), z.unknown())
      .describe(
        'The fields to update. Only include fields permitted by the schema returned by getCollectionSchema.',
      ),
    depth: z
      .number()
      .describe('How many levels deep to populate relationships')
      .optional()
      .default(0),
    draft: z
      .boolean()
      .describe(
        'Only if getCollectionSchema includes _status; otherwise _status does not exist. true saves only a draft version; false updates main and versions. data._status: "published" overrides true.',
      )
      .optional()
      .default(false),
    fallbackLocale: z
      .string()
      .describe('Optional: fallback locale code to use when requested locale is not available')
      .optional(),
    file: fileInputSchema.optional(),
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
    publishAllLocales: z
      .boolean()
      .describe(
        'For collections with localized publishing status, whether publishing should affect every locale. Set false with locale to publish only that locale.',
      )
      .optional(),
    select: z
      .record(z.string(), z.unknown())
      .describe(
        'Optional: define exactly which fields you\'d like to return in the response, e.g., {"title": true}',
      )
      .optional(),
    where: whereSchema
      .describe(
        'Where clause to update multiple documents. Use field names with Payload operators, and/or arrays for grouping. Example: {"title":{"contains":"test"}}',
      )
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
    file: fileInput,
    locale,
    overrideLock,
    overwriteExistingFiles,
    publishAllLocales,
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

    const virtualFieldNames = getCollectionVirtualFieldNames(payload.config, collectionSlug)
    const inputData = stripVirtualFields(data, virtualFieldNames)
    const validationError = validateCollectionData({
      collectionSlug,
      data: inputData,
      partial: true,
      req,
    })

    if (validationError) {
      return validationError
    }

    const parsedData = transformPointDataToPayload(inputData)
    const file = await resolveFile({ collectionSlug, input: fileInput, req })

    const whereClause: Where = where ?? {}

    if (id) {
      const result = await payload.update({
        id,
        collection: collectionSlug,
        data: parsedData,
        depth,
        draft,
        overrideAccess: authorizedMCP.overrideAccess,
        overrideLock,
        req,
        ...(file ? { file } : {}),
        ...(overwriteExistingFiles ? { overwriteExistingFiles } : {}),
        ...(publishAllLocales !== undefined ? { publishAllLocales } : {}),
        ...(locale ? { locale } : {}),
        ...(fallbackLocale ? { fallbackLocale } : {}),
        ...(select ? { select: select as SelectType } : {}),
      })

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

    const result = await payload.update({
      collection: collectionSlug,
      data: parsedData,
      depth,
      draft,
      overrideAccess: authorizedMCP.overrideAccess,
      overrideLock,
      req,
      where: whereClause,
      ...(file ? { file } : {}),
      ...(overwriteExistingFiles ? { overwriteExistingFiles } : {}),
      ...(publishAllLocales !== undefined ? { publishAllLocales } : {}),
      ...(locale ? { locale } : {}),
      ...(fallbackLocale ? { fallbackLocale } : {}),
      ...(select ? { select: select as SelectType } : {}),
    })

    const docs = result.docs || []
    const errors = result.errors || []

    let responseText = `Multiple documents updated in collection "${collectionSlug}"!\nUpdated: ${docs.length} documents\nErrors: ${errors.length}\n---`
    if (docs.length > 0) {
      responseText += `\n\nUpdated documents:\n\`\`\`json\n${JSON.stringify(docs)}\n\`\`\``
    }
    if (errors.length > 0) {
      responseText += `\n\nErrors:\n\`\`\`json\n${JSON.stringify(errors)}\n\`\`\``

      const errorSchema = getCollectionInputSchema({ collectionSlug, req })

      if (errorSchema) {
        responseText += `\n\nUse this schema for data:\n\`\`\`json\n${JSON.stringify(errorSchema)}\n\`\`\``
      }

      return {
        content: [{ type: 'text', text: responseText }],
        doc: { docs, errors } as unknown as Record<string, unknown>,
        isError: true,
        ...(errorSchema
          ? {
              structuredContent: {
                collectionSlug,
                docs,
                errors,
                schema: errorSchema,
              },
            }
          : {}),
      }
    }

    return {
      content: [{ type: 'text', text: responseText }],
      doc: { docs, errors } as unknown as Record<string, unknown>,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error updating document in ${collectionSlug}: ${errorMessage}`)
    return formatCollectionError({ action: 'updating', collectionSlug, error, req })
  }
})
