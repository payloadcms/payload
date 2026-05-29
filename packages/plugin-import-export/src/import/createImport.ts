import type { PayloadRequest, TypedUser } from 'payload'

import { APIError } from 'payload'

import type { ImportResult } from '../types.js'

import { applyFieldHooks } from '../utilities/applyFieldHooks.js'
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
  /**
   * Maximum number of documents that can be imported in a single operation.
   * This value has already been resolved from the plugin config.
   */
  maxLimit?: number
  name: string
  userCollection?: string
  userID?: number | string
}

export type CreateImportArgs = Import & {
  defaultVersionStatus?: 'draft' | 'published'
  req: PayloadRequest
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
  maxLimit,
  req,
  userCollection,
  userID,
}: CreateImportArgs): Promise<ImportResult> => {
  let user: TypedUser | undefined

  if (userCollection && userID) {
    user = (await req.payload.findByID({
      id: userID,
      collection: userCollection,
      req,
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
      msg: 'Starting import process with args:',
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
      mimeType: file.mimetype,
      msg: 'File info',
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

  const importHooks = collectionConfig.custom?.['plugin-import-export']?.importHooks

  // Get beforeImport functions for field transformations
  const importFieldHooks = getImportFieldFunctions({
    fields: collectionConfig.flattenedFields || [],
  })

  // Parse the file data
  let originalDocs: Record<string, unknown>[] | undefined
  let documents: Record<string, unknown>[]
  if (format === 'csv') {
    const rawData = await parseCSV({
      data: file.data,
      req,
    })

    originalDocs = rawData
    documents = rawData

    // Unflatten CSV data
    documents = documents
      .map((doc) => {
        const unflattened = unflattenObject({
          data: doc,
          fields: collectionConfig.flattenedFields ?? [],
          format,
          importFieldHooks,
          req,
        })
        return unflattened ?? {}
      })
      .filter((doc) => doc && Object.keys(doc).length > 0)

    if (debug) {
      req.payload.logger.debug({
        documentCount: documents.length,
        msg: 'After unflattening CSV',
        rawDataCount: rawData.length,
      })
    }
  } else {
    const parsedDocs = parseJSON({ data: file.data, req })
    originalDocs = parsedDocs
    // Apply field-level import hooks for JSON format
    documents = parsedDocs.map((doc) =>
      applyFieldHooks({
        type: 'beforeImport',
        data: doc,
        fieldHooks: importFieldHooks,
        fields: collectionConfig.flattenedFields ?? [],
        format,
        operation: 'import',
        req,
      }),
    )
  }

  if (debug) {
    req.payload.logger.debug({
      msg: `Parsed ${documents.length} documents from ${format} file`,
    })
    if (documents.length > 0) {
      req.payload.logger.debug({
        doc: documents[0],
        msg: 'First document sample:',
      })
    }
  }

  // Enforce maxLimit before processing to save memory/time
  if (typeof maxLimit === 'number' && maxLimit > 0 && documents.length > maxLimit) {
    throw new APIError(
      `Import file contains ${documents.length} documents but limit is ${maxLimit}`,
      400,
      null,
      true,
    )
  }

  // Remove disabled fields from all documents
  if (disabledFields.length > 0) {
    documents = documents.map((doc) => removeDisabledFields(doc, disabledFields))
  }

  if (debug) {
    req.payload.logger.debug({
      batchSize,
      documentCount: documents.length,
      msg: 'Processing import in batches',
    })
  }

  // Create batch processor
  const processor = createImportBatchProcessor({
    batchSize,
    defaultVersionStatus,
  })

  const totalBatches = documents.length > 0 ? Math.ceil(documents.length / batchSize) : 1

  // Process import with batch processor
  const result = await processor.processImport({
    collectionSlug,
    docs: documents,
    format,
    hooks: importHooks,
    importMode,
    matchField,
    originalDocs,
    req,
    totalBatches,
    user,
  })

  if (debug) {
    req.payload.logger.info({
      errors: result.errors.length,
      imported: result.imported,
      msg: 'Import completed',
      total: result.total,
      updated: result.updated,
    })
  }

  return result
}
