import type { PayloadRequest } from 'payload'

import { addDataAndFileToRequest } from 'payload'

import { removeDisabledFields } from '../utilities/removeDisabledFields.js'
import { getCustomFieldFunctions as getImportFieldFunctions } from './getCustomFieldFunctions.js'
import { parseCSV } from './parseCSV.js'
import { parseJSON } from './parseJSON.js'
import { unflattenObject } from './unflattenObject.js'

export const handlePreview = async (req: PayloadRequest) => {
  await addDataAndFileToRequest(req)

  const { collectionSlug, fileData, format } = req.data as {
    collectionSlug: string
    fileData?: string
    format?: 'csv' | 'json'
  }

  const targetCollection = req.payload.collections[collectionSlug]
  if (!targetCollection) {
    return Response.json(
      { error: `Collection with slug ${collectionSlug} not found` },
      { status: 400 },
    )
  }

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

    return Response.json({
      docs: parsedData,
      totalDocs: parsedData.length,
    })
  } catch (error) {
    req.payload.logger.error({ err: error, msg: 'Error parsing import preview data' })
    return Response.json({ error: 'Failed to parse file data' }, { status: 500 })
  }
}
