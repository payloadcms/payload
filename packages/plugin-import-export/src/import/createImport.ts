import type { PayloadRequest, TypedUser } from 'payload'

import { APIError } from 'payload'

import { getImportFieldFunctions } from '../utilities/getImportFieldFunctions.js'
import { parseCSV } from '../utilities/parseCSV.js'
import { parseJSON } from '../utilities/parseJSON.js'
import { removeDisabledFields } from '../utilities/removeDisabledFields.js'
import { unflattenObject } from '../utilities/unflattenObject.js'
import { createImportBatchProcessor } from './batchProcessor.js'

export type ImportMode = 'create' | 'update' | 'upsert'

export type Import = {
  /**
   * Number of documents to process in each batch during import
   * @default 100
   */
  batchSize?: number
  collectionSlug: string
  /**
   * If true, enabled debug logging
   */
  debug?: boolean
  file?: {
    data: Buffer
    mimetype: string
    name: string
  }
  format: 'csv' | 'json'
  id?: number | string
  /**
   * Import mode: create, update or upset
   */
  importMode: ImportMode
  matchField?: string
  name: string
  userCollection?: string
  userID?: number | string
}

export type CreateImportArgs = {
  defaultVersionStatus?: 'draft' | 'published'
  req: PayloadRequest
} & Import

export type ImportResult = {
  errors: Array<{
    doc: Record<string, unknown>
    error: string
    index: number
  }>
  imported: number
  total: number
  updated: number
}

export const createImport = async ({
  batchSize = 100,
  collectionSlug,
  debug = false,
  defaultVersionStatus = 'published',
  file,
  format,
  importMode = 'create',
  matchField = 'id',
  req,
  userCollection,
  userID,
}: CreateImportArgs): Promise<ImportResult> => {
  let user: TypedUser | undefined

  if (userCollection && userID) {
    user = (await req.payload.findByID({
      id: userID,
      collection: userCollection,
    })) as TypedUser
  }

  if (!user) {
    throw new APIError('User is required for import operations', 401, null, true)
  }

  if (debug) {
    req.payload.logger.debug({
      collectionSlug,
      format,
      importMode,
      matchField,
      message: 'Starting import process with args:',
      transactionID: req.transactionID, // Log transaction ID to verify we're in same transaction
    })
  }

  if (!collectionSlug) {
    throw new APIError('Collection slug is required', 400, null, true)
  }

  if (!file || !file?.data) {
    throw new APIError('No file data provided for import', 400, null, true)
  }

  if (debug) {
    req.payload.logger.debug({
      fileName: file.name,
      fileSize: file.data.length,
      message: 'File info',
      mimeType: file.mimetype,
    })
  }

  const collectionConfig = req.payload.config.collections.find(
    ({ slug }) => slug === collectionSlug,
  )

  if (!collectionConfig) {
    if (!collectionSlug) {
      throw new APIError('Collection slug is required', 400, null, true)
    }
    throw new APIError(`Collection with slug ${collectionSlug} not found`, 400, null, true)
  }

  // Get disabled fields configuration
  const disabledFields =
    collectionConfig.admin?.custom?.['plugin-import-export']?.disabledFields ?? []

  // Get fromCSV functions for field transformations
  const fromCSVFunctions = getImportFieldFunctions({
    fields: collectionConfig.flattenedFields || [],
  })

  // Parse the file data
  let documents: Record<string, unknown>[]
  if (format === 'csv') {
    const rawData = await parseCSV({
      data: file.data,
      req,
    })

    // Debug logging
    if (debug && rawData.length > 0) {
      req.payload.logger.info({
        firstRow: rawData[0], // Show the complete first row
        msg: 'Parsed CSV data - FULL',
      })
      req.payload.logger.info({
        msg: 'Parsed CSV data',
        rows: rawData.map((row, i) => ({
          excerpt: row.excerpt,
          hasManyNumber: row.hasManyNumber, // Add this to see what we get from CSV
          hasOnePolymorphic_id: row.hasOnePolymorphic_id,
          hasOnePolymorphic_relationTo: row.hasOnePolymorphic_relationTo,
          index: i,
          title: row.title,
        })),
      })
    }

    documents = rawData

    // Unflatten CSV data
    documents = documents
      .map((doc) => {
        const unflattened = unflattenObject({
          data: doc,
          fields: collectionConfig.flattenedFields ?? [],
          fromCSVFunctions,
          req,
        })
        return unflattened ?? {}
      })
      .filter((doc) => doc && Object.keys(doc).length > 0)

    // Debug after unflatten
    if (debug && documents.length > 0) {
      req.payload.logger.info({
        msg: 'After unflatten',
        rows: documents.map((row, i) => ({
          hasManyNumber: row.hasManyNumber, // Add this to see the actual value
          hasManyPolymorphic: row.hasManyPolymorphic,
          hasOnePolymorphic: row.hasOnePolymorphic,
          hasTitle: 'title' in row,
          index: i,
          title: row.title,
        })),
      })
    }

    if (debug) {
      req.payload.logger.debug({
        documentCount: documents.length,
        message: 'After unflattening CSV',
        rawDataCount: rawData.length,
      })

      // Debug: show a sample of raw vs unflattened
      if (rawData.length > 0 && documents.length > 0) {
        req.payload.logger.debug({
          message: 'Sample data transformation',
          raw: Object.keys(rawData[0] || {}).filter((k) => k.includes('localized')),
          unflattened: JSON.stringify(documents[0], null, 2),
        })
      }
    }
  } else {
    documents = parseJSON({ data: file.data, req })
  }

  if (debug) {
    req.payload.logger.debug({
      message: `Parsed ${documents.length} documents from ${format} file`,
    })
    if (documents.length > 0) {
      req.payload.logger.debug({
        doc: documents[0],
        message: 'First document sample:',
      })
    }
  }

  // Remove disabled fields from all documents
  if (disabledFields.length > 0) {
    documents = documents.map((doc) => removeDisabledFields(doc, disabledFields))
  }

  if (debug) {
    req.payload.logger.debug({
      batchSize,
      documentCount: documents.length,
      message: 'Processing import in batches',
    })
  }

  // Create batch processor
  const processor = createImportBatchProcessor({
    batchSize,
    defaultVersionStatus,
  })

  // Process import with batch processor
  const result = await processor.processImport({
    collectionSlug,
    documents,
    importMode,
    matchField,
    req,
    user,
  })

  if (debug) {
    req.payload.logger.info({
      errors: result.errors.length,
      imported: result.imported,
      message: 'Import completed',
      total: result.total,
      updated: result.updated,
    })
  }

  return result
}
