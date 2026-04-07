import type { PayloadRequest } from 'payload'

import { addDataAndFileToRequest } from 'payload'

import type { ImportPreviewResponse } from '../types.js'

import {
  DEFAULT_PREVIEW_LIMIT,
  MAX_PREVIEW_LIMIT,
  MIN_PREVIEW_LIMIT,
  MIN_PREVIEW_PAGE,
} from '../constants.js'
import { getImportFieldFunctions } from '../utilities/getImportFieldFunctions.js'
import { parseCSV } from '../utilities/parseCSV.js'
import { parseJSON } from '../utilities/parseJSON.js'
import { removeDisabledFields } from '../utilities/removeDisabledFields.js'
import { resolveLimit } from '../utilities/resolveLimit.js'
import { unflattenObject } from '../utilities/unflattenObject.js'

export const handlePreview = async (req: PayloadRequest): Promise<Response> => {
  await addDataAndFileToRequest(req)

  const {
    collectionSlug,
    fileData,
    format,
    previewLimit: rawPreviewLimit = DEFAULT_PREVIEW_LIMIT,
    previewPage: rawPreviewPage = 1,
  } = req.data as {
    collectionSlug: string
    fileData?: string
    format?: 'csv' | 'json'
    previewLimit?: number
    previewPage?: number
  }

  // Validate and clamp pagination values to safe bounds
  const previewLimit = Math.max(MIN_PREVIEW_LIMIT, Math.min(rawPreviewLimit, MAX_PREVIEW_LIMIT))
  const previewPage = Math.max(MIN_PREVIEW_PAGE, rawPreviewPage)

  const targetCollection = req.payload.collections[collectionSlug]
  if (!targetCollection) {
    return Response.json(
      { error: `Collection with slug ${collectionSlug} not found` },
      { status: 400 },
    )
  }

  // Resolve max limit from the collection config
  const pluginConfig = targetCollection.config.custom?.['plugin-import-export']
  const maxLimit = await resolveLimit({
    limit: pluginConfig?.importLimit,
    req,
  })

  if (!fileData) {
    return Response.json({ error: 'No file data provided' }, { status: 400 })
  }

  try {
    // Parse the file data
    let parsedData: Record<string, unknown>[]
    const buffer = Buffer.from(fileData, 'base64')

    if (format === 'csv') {
      const rawData = await parseCSV({ data: buffer, req })

      // Get fromCSV functions for field transformations
      const fromCSVFunctions = getImportFieldFunctions({
        fields: targetCollection.config.flattenedFields || [],
      })

      // Unflatten CSV data
      parsedData = rawData
        .map((doc) => {
          const unflattened = unflattenObject({
            data: doc,
            fields: targetCollection.config.flattenedFields ?? [],
            fromCSVFunctions,
            req,
          })
          return unflattened ?? {}
        })
        .filter((doc) => doc && Object.keys(doc).length > 0)
    } else {
      parsedData = parseJSON({ data: buffer, req })
    }

    // Remove disabled fields from the documents
    const disabledFields =
      targetCollection.config.admin?.custom?.['plugin-import-export']?.disabledFields ?? []

    if (disabledFields.length > 0) {
      parsedData = parsedData.map((doc) => removeDisabledFields(doc, disabledFields))
    }

    // Calculate pagination
    const totalDocs = parsedData.length
    const totalPages = totalDocs === 0 ? 0 : Math.ceil(totalDocs / previewLimit)
    const startIndex = (previewPage - 1) * previewLimit
    const endIndex = startIndex + previewLimit
    const paginatedDocs = parsedData.slice(startIndex, endIndex)

    const hasNextPage = previewPage < totalPages
    const hasPrevPage = previewPage > 1

    // Check if the file exceeds the max limit
    const limitExceeded = typeof maxLimit === 'number' && maxLimit > 0 && totalDocs > maxLimit

    const response: ImportPreviewResponse = {
      docs: paginatedDocs,
      hasNextPage,
      hasPrevPage,
      limit: previewLimit,
      limitExceeded,
      maxLimit,
      page: previewPage,
      totalDocs,
      totalPages,
    }

    return Response.json(response)
  } catch (error) {
    req.payload.logger.error({ err: error, msg: 'Error parsing import preview data' })
    return Response.json({ error: 'Failed to parse file data' }, { status: 500 })
  }
}
