import type { Where } from 'payload'

import {
  getCollectionInputSchema,
  getCollectionVirtualFieldNames,
  parseDocumentID,
  stripVirtualFields,
  transformPointDataToPayload,
  updateDocumentInputSchema,
  validateCollectionData,
} from 'payload'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineCollectionTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'
import { formatEntityError } from '../formatEntityError.js'
import { fileInputSchema, resolveFile } from './fileInput.js'

const DEFAULT_DESCRIPTION =
  'Update documents. Prefer uploadReference after upload, externalURL for URLs, or base64 for small local files.'

export const updateDocumentTool = defineCollectionTool({
  access: (args) =>
    defaultAccess(args) && Boolean(args.permissions?.collections?.[args.slug]?.update),
  annotations: {
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
    readOnlyHint: false,
    title: 'Update Document',
  },
  description: DEFAULT_DESCRIPTION,
  input: updateDocumentInputSchema({ file: fileInputSchema }),
}).handler(async ({ slug, authorizedMCP, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })

  const {
    id,
    data,
    depth,
    draft,
    fallbackLocale,
    file: fileInput,
    limit,
    locale,
    overrideLock,
    populate,
    publishAllLocales,
    returning,
    select,
    sort,
    trash,
    unpublishAllLocales,
    where,
  } = input

  logger.info(
    `Updating document in collection: ${slug}${id ? ` with ID: ${id}` : ' with where clause'}, draft: ${draft}${locale ? `, locale: ${locale}` : ''}`,
  )

  try {
    const virtualFieldNames = getCollectionVirtualFieldNames(payload.config, slug)
    const inputData = stripVirtualFields(data, virtualFieldNames)
    validateCollectionData({
      slug,
      data: inputData,
      partial: true,
      req,
    })

    const parsedData = transformPointDataToPayload(inputData)
    const file = await resolveFile({ slug, input: fileInput, req })

    const whereClause: Where = where ?? {}

    if (id !== undefined) {
      const result = await payload.update({
        id: parseDocumentID({ id, collectionSlug: slug, payload }),
        collection: slug,
        data: parsedData,
        depth,
        draft,
        fallbackLocale,
        locale,
        overrideAccess: authorizedMCP.overrideAccess,
        overrideLock,
        populate,
        publishAllLocales,
        req,
        select: returning ? select : { id: true },
        trash,
        unpublishAllLocales,
        ...(file ? { file } : {}),
      })

      const responseResult = returning ? result : { id: result.id }

      return {
        content: [
          {
            type: 'text',
            text: `Document updated successfully in collection "${slug}"!\nResult:\n\`\`\`json\n${JSON.stringify(responseResult)}\n\`\`\``,
          },
        ],
        doc: responseResult as Record<string, unknown>,
      }
    }

    const result = await payload.update({
      collection: slug,
      data: parsedData,
      depth,
      draft,
      fallbackLocale,
      limit,
      locale,
      overrideAccess: authorizedMCP.overrideAccess,
      overrideLock,
      populate,
      publishAllLocales,
      req,
      select: returning ? select : { id: true },
      sort,
      trash,
      unpublishAllLocales,
      where: whereClause,
      ...(file ? { file } : {}),
    })

    const docs = returning ? result.docs : result.docs.map(({ id }) => ({ id }))
    const errors = result.errors || []

    let responseText = `Multiple documents updated in collection "${slug}"!\nUpdated: ${docs.length} documents\nErrors: ${errors.length}\n---`
    if (docs.length > 0) {
      responseText += `\n\nUpdated documents:\n\`\`\`json\n${JSON.stringify(docs)}\n\`\`\``
    }
    if (errors.length > 0) {
      responseText += `\n\nErrors:\n\`\`\`json\n${JSON.stringify(errors)}\n\`\`\``

      const errorSchema = getCollectionInputSchema({ collectionSlug: slug, req })

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
                slug,
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
    logger.error(`Error updating document in ${slug}: ${errorMessage}`)
    return formatEntityError({ slug, action: 'updating', entity: 'collection', error, req })
  }
})
