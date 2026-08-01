import { getPayloadOperation, invokeOperation, type SelectType, type Where } from 'payload'
import { z } from 'zod'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineCollectionTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'
import { getCollectionInputSchema } from '../../../utils/schemaConversion/getEntityInputSchema.js'
import { fileInputSchema, resolveFile } from './fileInput.js'
import { formatCollectionError } from './formatCollectionError.js'

const updateOperation = getPayloadOperation('collection', 'update')

const DEFAULT_DESCRIPTION =
  'Update documents. Prefer uploadReference after upload, externalURL for URLs, or base64 for small local files.'

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
  input: z
    .looseObject({
      id: updateOperation.input.shape.id,
      data: updateOperation.input.shape.data,
      depth: updateOperation.input.shape.depth,
      draft: updateOperation.input.shape.draft,
      fallbackLocale: updateOperation.input.shape.fallbackLocale,
      locale: updateOperation.input.shape.locale,
      overrideLock: updateOperation.input.shape.overrideLock,
      overwriteExistingFiles: updateOperation.input.shape.overwriteExistingFiles,
      publishAllLocales: updateOperation.input.shape.publishAllLocales,
      select: updateOperation.input.shape.select,
      where: updateOperation.input.shape.where,
    })
    .extend({ file: fileInputSchema.optional() })
    .refine(({ id, where }) => id !== undefined || where !== undefined, {
      message: 'Either id or where must be provided',
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

    const file = await resolveFile({ collectionSlug, input: fileInput, req })

    const whereClause: Where = where ?? {}

    if (id) {
      const result = await invokeOperation(updateOperation, {
        context: payload,
        input: {
          id,
          collection: collectionSlug,
          data,
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
        },
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

    const result = await invokeOperation(updateOperation, {
      context: payload,
      input: {
        collection: collectionSlug,
        data,
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
      },
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
