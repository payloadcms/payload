import type { PayloadRequest, TypedUser } from 'payload'

import type { ImportMode, ImportResult } from './createImport.js'

import {
  type BatchError,
  categorizeError,
  createBatches,
  extractErrorMessage,
} from '../utilities/useBatchProcessor.js'

/**
 * Import-specific batch processor options
 */
export interface ImportBatchProcessorOptions {
  batchSize?: number
  defaultVersionStatus?: 'draft' | 'published'
}

/**
 * Import-specific error type extending the generic BatchError
 */
export interface ImportError extends BatchError<Record<string, unknown>> {
  documentData: Record<string, unknown>
  field?: string
  fieldLabel?: string
  rowNumber: number // 1-indexed for user clarity
}

/**
 * Result from processing a single import batch
 */
export interface ImportBatchResult {
  failed: Array<ImportError>
  successful: Array<{
    document: Record<string, unknown>
    index: number
    operation?: 'created' | 'updated'
    result: Record<string, unknown>
  }>
}

/**
 * Options for processing an import operation
 */
export interface ImportProcessOptions {
  collectionSlug: string
  documents: Record<string, unknown>[]
  importMode: ImportMode
  matchField?: string
  req: PayloadRequest
  user?: TypedUser
}

/**
 * Separates multi-locale data from a document for sequential locale updates.
 *
 * When a field has locale-keyed values (e.g., { title: { en: 'Hello', es: 'Hola' } }),
 * this extracts the first locale's data for initial create/update, and stores
 * remaining locales for subsequent update calls.
 *
 * @returns
 * - flatData: Document with first locale values extracted (for initial operation)
 * - hasMultiLocale: Whether any multi-locale fields were found
 * - localeUpdates: Map of locale -> field data for follow-up updates
 */
function extractMultiLocaleData(
  data: Record<string, unknown>,
  configuredLocales?: string[],
): {
  flatData: Record<string, unknown>
  hasMultiLocale: boolean
  localeUpdates: Record<string, Record<string, unknown>>
} {
  const flatData: Record<string, unknown> = {}
  const localeUpdates: Record<string, Record<string, unknown>> = {}
  let hasMultiLocale = false

  if (!configuredLocales || configuredLocales.length === 0) {
    return { flatData: { ...data }, hasMultiLocale: false, localeUpdates: {} }
  }

  const localeSet = new Set(configuredLocales)

  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const valueObj = value as Record<string, unknown>
      const localeKeys = Object.keys(valueObj).filter((k) => localeSet.has(k))

      if (localeKeys.length > 0) {
        hasMultiLocale = true
        const firstLocale = localeKeys[0]
        if (firstLocale) {
          flatData[key] = valueObj[firstLocale]
          for (const locale of localeKeys) {
            if (locale !== firstLocale) {
              if (!localeUpdates[locale]) {
                localeUpdates[locale] = {}
              }
              localeUpdates[locale][key] = valueObj[locale]
            }
          }
        }
      } else {
        flatData[key] = value
      }
    } else {
      flatData[key] = value
    }
  }

  return { flatData, hasMultiLocale, localeUpdates }
}

type ProcessImportBatchOptions = {
  batch: Record<string, unknown>[]
  batchIndex: number
  collectionSlug: string
  importMode: ImportMode
  matchField: string | undefined
  options: { batchSize: number; defaultVersionStatus: 'draft' | 'published' }
  req: PayloadRequest
  user?: TypedUser
}

/**
 * Processes a batch of documents for import based on the import mode.
 *
 * For each document in the batch:
 * - create: Creates a new document (removes any existing ID)
 * - update: Finds existing document by matchField and updates it
 * - upsert: Updates if found, creates if not found
 *
 * Handles versioned collections, multi-locale data, and MongoDB ObjectID validation.
 * Continues processing remaining documents even if individual imports fail.
 */
async function processImportBatch({
  batch,
  batchIndex,
  collectionSlug,
  importMode,
  matchField,
  options,
  req,
  user,
}: ProcessImportBatchOptions): Promise<ImportBatchResult> {
  const result: ImportBatchResult = {
    failed: [],
    successful: [],
  }

  const collectionConfig = req.payload.collections[collectionSlug]?.config
  const collectionHasVersions = Boolean(collectionConfig?.versions)
  const hasCustomIdField = collectionConfig?.fields.some(
    (field) => 'name' in field && field.name === 'id',
  )

  const configuredLocales = req.payload.config.localization
    ? req.payload.config.localization.localeCodes
    : undefined

  const startingRowNumber = batchIndex * options.batchSize

  for (let i = 0; i < batch.length; i++) {
    const document = batch[i]
    if (!document) {
      continue
    }
    const rowNumber = startingRowNumber + i + 1

    try {
      let savedDocument: Record<string, unknown> | undefined
      let existingDocResult: { docs: Array<Record<string, unknown>> } | undefined

      if (importMode === 'create') {
        const createData = { ...document }
        if (!hasCustomIdField) {
          delete createData.id
        }

        let draftOption: boolean | undefined
        if (collectionHasVersions) {
          const statusValue = createData._status || options.defaultVersionStatus
          const isPublished = statusValue !== 'draft'
          draftOption = !isPublished

          if (req.payload.config.debug) {
            req.payload.logger.info({
              _status: createData._status,
              isPublished,
              msg: 'Status handling in create',
              willSetDraft: draftOption,
            })
          }

          // Remove _status from data - it's controlled via draft option
          delete createData._status
        }

        if (req.payload.config.debug && 'title' in createData) {
          req.payload.logger.info({
            msg: 'Creating document',
            title: createData.title,
            titleIsNull: createData.title === null,
            titleType: typeof createData.title,
          })
        }

        // Check if we have multi-locale data and extract it
        const { flatData, hasMultiLocale, localeUpdates } = extractMultiLocaleData(
          createData,
          configuredLocales,
        )

        if (hasMultiLocale) {
          // Create with default locale data
          savedDocument = await req.payload.create({
            collection: collectionSlug,
            data: flatData,
            draft: draftOption,
            overrideAccess: false,
            req,
            user,
          })

          // Update for other locales
          if (savedDocument && Object.keys(localeUpdates).length > 0) {
            for (const [locale, localeData] of Object.entries(localeUpdates)) {
              try {
                const localeReq = { ...req, locale }
                await req.payload.update({
                  id: savedDocument.id as number | string,
                  collection: collectionSlug,
                  data: localeData,
                  draft: collectionHasVersions ? false : undefined,
                  overrideAccess: false,
                  req: localeReq,
                  user,
                })
              } catch (error) {
                // Log but don't fail the entire import if a locale update fails
                req.payload.logger.error({
                  err: error,
                  msg: `Failed to update locale ${locale} for document ${String(savedDocument.id)}`,
                })
              }
            }
          }
        } else {
          // No multi-locale data, create normally
          savedDocument = await req.payload.create({
            collection: collectionSlug,
            data: createData,
            draft: draftOption,
            overrideAccess: false,
            req,
            user,
          })
        }
      } else if (importMode === 'update' || importMode === 'upsert') {
        const matchValue = document[matchField || 'id']
        if (!matchValue) {
          throw new Error(`Match field "${matchField || 'id'}" not found in document`)
        }

        // Special handling for ID field with MongoDB
        // If matching by 'id' and it's not a valid ObjectID format, handle specially
        const isMatchingById = (matchField || 'id') === 'id'

        // Check if it's a valid MongoDB ObjectID format (24 hex chars)
        // Note: matchValue could be string, number, or ObjectID object
        let matchValueStr: string
        if (typeof matchValue === 'object' && matchValue !== null) {
          matchValueStr = JSON.stringify(matchValue)
        } else if (typeof matchValue === 'string') {
          matchValueStr = matchValue
        } else if (typeof matchValue === 'number') {
          matchValueStr = matchValue.toString()
        } else {
          // For other types, use JSON.stringify
          matchValueStr = JSON.stringify(matchValue)
        }
        const isValidObjectIdFormat = /^[0-9a-f]{24}$/i.test(matchValueStr)

        try {
          existingDocResult = await req.payload.find({
            collection: collectionSlug,
            depth: 0,
            limit: 1,
            overrideAccess: false,
            req,
            user,
            where: {
              [matchField || 'id']: {
                equals: matchValue,
              },
            },
          })
        } catch (error) {
          // MongoDB may throw for invalid ObjectID format - handle gracefully for upsert
          if (isMatchingById && importMode === 'upsert' && !isValidObjectIdFormat) {
            existingDocResult = { docs: [] }
          } else if (isMatchingById && importMode === 'update' && !isValidObjectIdFormat) {
            throw new Error(`Invalid ID format for update: ${matchValueStr}`)
          } else {
            throw error
          }
        }

        if (existingDocResult.docs.length > 0) {
          const existingDoc = existingDocResult.docs[0]
          if (!existingDoc) {
            throw new Error(`Document not found`)
          }

          // Debug: log what we found
          if (req.payload.config.debug) {
            req.payload.logger.info({
              existingId: existingDoc.id,
              existingStatus: existingDoc._status,
              existingTitle: existingDoc.title,
              incomingDocument: document,
              mode: importMode,
              msg: 'Found existing document for update',
            })
          }

          const updateData = { ...document }
          // Remove ID and internal fields from update data
          delete updateData.id
          delete updateData._id
          delete updateData.createdAt
          delete updateData.updatedAt

          // Check if we have multi-locale data and extract it
          const { flatData, hasMultiLocale, localeUpdates } = extractMultiLocaleData(
            updateData,
            configuredLocales,
          )

          if (req.payload.config.debug) {
            req.payload.logger.info({
              existingId: existingDoc.id,
              hasMultiLocale,
              mode: importMode,
              msg: 'Updating document in upsert/update mode',
              updateData: Object.keys(hasMultiLocale ? flatData : updateData).reduce(
                (acc, key) => {
                  const val = (hasMultiLocale ? flatData : updateData)[key]
                  acc[key] =
                    typeof val === 'string' && val.length > 50 ? val.substring(0, 50) + '...' : val
                  return acc
                },
                {} as Record<string, unknown>,
              ),
            })
          }

          if (hasMultiLocale) {
            // Update with default locale data
            savedDocument = await req.payload.update({
              id: existingDoc.id as number | string,
              collection: collectionSlug,
              data: flatData,
              depth: 0,
              // Don't specify draft - this creates a new draft for versioned collections
              overrideAccess: false,
              req,
              user,
            })

            // Update for other locales
            if (savedDocument && Object.keys(localeUpdates).length > 0) {
              for (const [locale, localeData] of Object.entries(localeUpdates)) {
                try {
                  // Clone the request with the specific locale
                  const localeReq = { ...req, locale }
                  await req.payload.update({
                    id: existingDoc.id as number | string,
                    collection: collectionSlug,
                    data: localeData,
                    depth: 0,
                    // Don't specify draft - this creates a new draft for versioned collections
                    overrideAccess: false,
                    req: localeReq,
                    user,
                  })
                } catch (error) {
                  // Log but don't fail the entire import if a locale update fails
                  req.payload.logger.error({
                    err: error,
                    msg: `Failed to update locale ${locale} for document ${String(existingDoc.id)}`,
                  })
                }
              }
            }
          } else {
            // No multi-locale data, update normally
            try {
              // Extra debug: log before update
              if (req.payload.config.debug) {
                req.payload.logger.info({
                  existingId: existingDoc.id,
                  existingTitle: existingDoc.title,
                  msg: 'About to update document',
                  newData: updateData,
                })
              }

              // Update the document - don't specify draft to let Payload handle versions properly
              // This will create a new draft version for collections with versions enabled
              savedDocument = await req.payload.update({
                id: existingDoc.id as number | string,
                collection: collectionSlug,
                data: updateData,
                depth: 0,
                // Don't specify draft - this creates a new draft for versioned collections
                overrideAccess: false,
                req,
                user,
              })

              if (req.payload.config.debug && savedDocument) {
                req.payload.logger.info({
                  id: savedDocument.id,
                  msg: 'Update completed',
                  status: savedDocument._status,
                  title: savedDocument.title,
                })
              }
            } catch (updateError) {
              req.payload.logger.error({
                id: existingDoc.id,
                err: updateError,
                msg: 'Update failed',
              })
              throw updateError
            }
          }
        } else if (importMode === 'upsert') {
          // Create new in upsert mode
          if (req.payload.config.debug) {
            req.payload.logger.info({
              document,
              matchField: matchField || 'id',
              matchValue: document[matchField || 'id'],
              msg: 'No existing document found, creating new in upsert mode',
            })
          }

          const createData = { ...document }
          if (!hasCustomIdField) {
            delete createData.id
          }

          // Only handle _status for versioned collections
          let draftOption: boolean | undefined
          if (collectionHasVersions) {
            // Use defaultVersionStatus from config if _status not provided
            const statusValue = createData._status || options.defaultVersionStatus
            const isPublished = statusValue !== 'draft'
            draftOption = !isPublished
            // Remove _status from data - it's controlled via draft option
            delete createData._status
          }

          // Check if we have multi-locale data and extract it
          const { flatData, hasMultiLocale, localeUpdates } = extractMultiLocaleData(
            createData,
            configuredLocales,
          )

          if (hasMultiLocale) {
            // Create with default locale data
            savedDocument = await req.payload.create({
              collection: collectionSlug,
              data: flatData,
              draft: draftOption,
              overrideAccess: false,
              req,
              user,
            })

            // Update for other locales
            if (savedDocument && Object.keys(localeUpdates).length > 0) {
              for (const [locale, localeData] of Object.entries(localeUpdates)) {
                try {
                  // Clone the request with the specific locale
                  const localeReq = { ...req, locale }
                  await req.payload.update({
                    id: savedDocument.id as number | string,
                    collection: collectionSlug,
                    data: localeData,
                    draft: collectionHasVersions ? false : undefined,
                    overrideAccess: false,
                    req: localeReq,
                  })
                } catch (error) {
                  // Log but don't fail the entire import if a locale update fails
                  req.payload.logger.error({
                    err: error,
                    msg: `Failed to update locale ${locale} for document ${String(savedDocument.id)}`,
                  })
                }
              }
            }
          } else {
            // No multi-locale data, create normally
            savedDocument = await req.payload.create({
              collection: collectionSlug,
              data: createData,
              draft: draftOption,
              overrideAccess: false,
              req,
              user,
            })
          }
        } else {
          // Update mode but document not found
          let matchValueDisplay: string
          if (typeof matchValue === 'object' && matchValue !== null) {
            matchValueDisplay = JSON.stringify(matchValue)
          } else if (typeof matchValue === 'string') {
            matchValueDisplay = matchValue
          } else if (typeof matchValue === 'number') {
            matchValueDisplay = matchValue.toString()
          } else {
            // For other types, use JSON.stringify to avoid [object Object]
            matchValueDisplay = JSON.stringify(matchValue)
          }
          throw new Error(`Document with ${matchField || 'id'}="${matchValueDisplay}" not found`)
        }
      } else {
        throw new Error(`Unknown import mode: ${String(importMode)}`)
      }

      if (savedDocument) {
        // Determine operation type for proper counting
        let operation: 'created' | 'updated' | undefined
        if (importMode === 'create') {
          operation = 'created'
        } else if (importMode === 'update') {
          operation = 'updated'
        } else if (importMode === 'upsert') {
          if (existingDocResult && existingDocResult.docs.length > 0) {
            operation = 'updated'
          } else {
            operation = 'created'
          }
        }

        result.successful.push({
          document,
          index: rowNumber - 1, // Store as 0-indexed
          operation,
          result: savedDocument,
        })
      }
    } catch (error) {
      const importError: ImportError = {
        type: categorizeError(error),
        documentData: document || {},
        error: extractErrorMessage(error),
        item: document || {},
        itemIndex: rowNumber - 1,
        rowNumber,
      }

      // Try to extract field information from validation errors
      if (error && typeof error === 'object' && 'data' in error) {
        const errorData = error as { data?: { errors?: Array<{ path?: string }> } }
        if (errorData.data?.errors && Array.isArray(errorData.data.errors)) {
          const firstError = errorData.data.errors[0]
          if (firstError?.path) {
            importError.field = firstError.path
          }
        }
      }

      result.failed.push(importError)
      // Always continue processing all rows
    }
  }

  return result
}

export function createImportBatchProcessor(options: ImportBatchProcessorOptions = {}) {
  const processorOptions = {
    batchSize: options.batchSize ?? 100,
    defaultVersionStatus: options.defaultVersionStatus ?? 'published',
  }

  const processImport = async (processOptions: ImportProcessOptions): Promise<ImportResult> => {
    const { collectionSlug, documents, importMode, matchField, req, user } = processOptions
    const batches = createBatches(documents, processorOptions.batchSize)

    const result: ImportResult = {
      errors: [],
      imported: 0,
      total: documents.length,
      updated: 0,
    }

    for (let i = 0; i < batches.length; i++) {
      const currentBatch = batches[i]
      if (!currentBatch) {
        continue
      }

      const batchResult = await processImportBatch({
        batch: currentBatch,
        batchIndex: i,
        collectionSlug,
        importMode,
        matchField,
        options: processorOptions,
        req,
        user,
      })

      // Update results
      for (const success of batchResult.successful) {
        if (success.operation === 'created') {
          result.imported++
        } else if (success.operation === 'updated') {
          result.updated++
        } else {
          // Fallback
          if (importMode === 'create') {
            result.imported++
          } else {
            result.updated++
          }
        }
      }

      for (const error of batchResult.failed) {
        result.errors.push({
          doc: error.documentData,
          error: error.error,
          index: error.rowNumber - 1, // Convert back to 0-indexed
        })
      }
    }

    return result
  }

  return {
    processImport,
  }
}
