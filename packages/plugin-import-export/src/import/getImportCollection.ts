import type { CollectionAfterChangeHook, CollectionConfig } from 'payload'

import { FileRetrievalError } from 'payload'

import type { ImportConfig, ImportExportPluginConfig } from '../types.js'
import type { ImportTaskInput } from './getCreateImportCollectionTask.js'

import { getFileFromDoc } from '../utilities/getFileFromDoc.js'
import { resolveLimit } from '../utilities/resolveLimit.js'
import { createImport } from './createImport.js'
import { getFields } from './getFields.js'
import { handlePreview } from './handlePreview.js'

const FALLBACK_BATCH_SIZE = 100
const FALLBACK_VERSION_STATUS = 'published'

export const getImportCollection = ({
  collectionSlugs,
  importConfig,
  pluginConfig,
}: {
  /**
   * Collection slugs that this import collection supports.
   */
  collectionSlugs: string[]
  importConfig?: ImportConfig
  pluginConfig: ImportExportPluginConfig
}): CollectionConfig => {
  const afterChange: CollectionAfterChangeHook[] = []

  const collection: CollectionConfig = {
    slug: 'imports',
    access: {
      update: () => false,
    },
    admin: {
      components: {
        edit: {
          SaveButton: '@payloadcms/plugin-import-export/rsc#ImportSaveButton',
        },
      },
      custom: {
        'plugin-import-export': {
          collectionSlugs,
        },
      },
      disableCopyToLocale: true,
      group: false,
      useAsTitle: 'filename',
    },
    disableDuplicate: true,
    endpoints: [
      {
        handler: handlePreview,
        method: 'post',
        path: '/preview-data',
      },
    ],
    fields: getFields({ collectionSlugs }),
    hooks: {
      afterChange,
    },
    lockDocuments: false,
    upload: {
      filesRequiredOnCreate: true,
      hideFileInputOnCreate: false,
      hideRemoveFile: true,
      mimeTypes: ['text/csv', 'application/json'],
    },
  }

  afterChange.push(async ({ collection: collectionConfig, doc, operation, req }) => {
    if (operation !== 'create' || doc.status !== 'pending') {
      return doc
    }

    const targetCollection = req.payload.collections[doc.collectionSlug]
    const targetPluginConfig = targetCollection?.config.custom?.['plugin-import-export']

    const disableJobsQueue =
      targetPluginConfig?.importDisableJobsQueue ?? importConfig?.disableJobsQueue ?? false

    const debug = pluginConfig.debug || false

    if (debug) {
      req.payload.logger.info({
        collectionSlug: doc.collectionSlug,
        disableJobsQueue,
        docId: doc.id,
        msg: '[Import Sync Hook] Starting',
        transactionID: req.transactionID,
      })
    }

    if (!disableJobsQueue) {
      return doc
    }

    try {
      // Get file data from the uploaded document
      // First try req.file which is available during the same request (especially important for cloud storage)
      // Fall back to getFileFromDoc for cases where req.file isn't available
      let fileData: Buffer
      let fileMimetype: string

      if (req.file?.data) {
        fileData = req.file.data
        fileMimetype = req.file.mimetype || doc.mimeType

        if (!fileMimetype) {
          throw new FileRetrievalError(
            req.t,
            `Unable to determine mimetype for file: ${doc.filename}`,
          )
        }
      } else {
        const fileFromDoc = await getFileFromDoc({
          collectionConfig,
          doc: {
            filename: doc.filename,
            mimeType: doc.mimeType,
            url: doc.url,
          },
          req,
        })
        fileData = fileFromDoc.data
        fileMimetype = fileFromDoc.mimetype
      }

      const maxLimit = await resolveLimit({
        limit: targetPluginConfig?.importLimit,
        req,
      })
      const defaultVersionStatus =
        targetPluginConfig?.defaultVersionStatus ??
        importConfig?.defaultVersionStatus ??
        pluginConfig.defaultVersionStatus ??
        FALLBACK_VERSION_STATUS
      const batchSize =
        targetPluginConfig?.importBatchSize ??
        importConfig?.batchSize ??
        pluginConfig.batchSize ??
        FALLBACK_BATCH_SIZE

      const result = await createImport({
        id: doc.id,
        name: doc.filename || 'import',
        batchSize,
        collectionSlug: doc.collectionSlug,
        debug,
        defaultVersionStatus,
        file: {
          name: doc.filename,
          data: fileData,
          mimetype: fileMimetype,
        },
        format: fileMimetype === 'text/csv' ? 'csv' : 'json',
        importMode: doc.importMode || 'create',
        matchField: doc.matchField,
        maxLimit,
        req,
        userCollection: req?.user?.collection || req?.user?.user?.collection,
        userID: req?.user?.id || req?.user?.user?.id,
      })

      // Determine status
      let status: 'completed' | 'failed' | 'partial'
      if (result.errors.length === 0) {
        status = 'completed'
      } else if (result.imported + result.updated === 0) {
        status = 'failed'
      } else {
        status = 'partial'
      }

      const summary = {
        imported: result.imported,
        issueDetails:
          result.errors.length > 0
            ? result.errors.map((e) => ({
                data: e.doc,
                error: e.error,
                row: e.index + 1,
              }))
            : undefined,
        issues: result.errors.length,
        total: result.total,
        updated: result.updated,
      }

      // Try to update the document with results
      try {
        await req.payload.update({
          id: doc.id,
          collection: collectionConfig.slug,
          data: {
            status,
            summary,
          },
          overrideAccess: true,
          req,
        })
      } catch (updateErr) {
        // Update may fail if document not yet committed
        if (debug) {
          req.payload.logger.error({
            err: updateErr,
            msg: `Failed to update import document ${doc.id} with results`,
          })
        }
      }

      // Return updated doc for immediate response
      return {
        ...doc,
        status,
        summary,
      }
    } catch (err) {
      const summary = {
        imported: 0,
        issueDetails: [
          {
            data: {},
            error: err instanceof Error ? err.message : String(err),
            row: 0,
          },
        ],
        issues: 1,
        total: 0,
        updated: 0,
      }

      if (debug) {
        req.payload.logger.error({
          docId: doc.id,
          err,
          msg: '[Import Sync Hook] Import processing failed, attempting to update status',
          transactionID: req.transactionID,
        })
      }

      // Try to update document with error status
      try {
        if (debug) {
          req.payload.logger.info({
            collectionSlug: collectionConfig.slug,
            docId: doc.id,
            msg: '[Import Sync Hook] About to update document with failed status',
          })
        }
        await req.payload.update({
          id: doc.id,
          collection: collectionConfig.slug,
          data: {
            status: 'failed',
            summary,
          },
          overrideAccess: true,
          req,
        })
        if (debug) {
          req.payload.logger.info({
            docId: doc.id,
            msg: '[Import Sync Hook] Successfully updated document with failed status',
          })
        }
      } catch (updateErr) {
        // Update may fail if document not yet committed, log but continue
        // ALWAYS log this error to help debug Postgres issues
        req.payload.logger.error({
          err: updateErr,
          msg: `[Import Sync Hook] Failed to update import document ${doc.id} with error status`,
          transactionID: req.transactionID,
        })
      }

      if (debug) {
        req.payload.logger.info({
          docId: doc.id,
          msg: '[Import Sync Hook] Returning failed doc',
          status: 'failed',
        })
      }

      // Return error status for immediate response
      return {
        ...doc,
        status: 'failed',
        summary,
      }
    }
  })

  afterChange.push(async ({ collection: collectionConfig, doc, operation, req }) => {
    if (operation !== 'create') {
      return
    }

    const targetCollection = req.payload.collections[doc.collectionSlug]
    const targetPluginConfig = targetCollection?.config.custom?.['plugin-import-export']

    const disableJobsQueue =
      targetPluginConfig?.importDisableJobsQueue ?? importConfig?.disableJobsQueue ?? false

    if (pluginConfig.debug) {
      req.payload.logger.info({
        collectionSlug: doc.collectionSlug,
        disableJobsQueue,
        docId: doc.id,
        docStatus: doc.status,
        msg: '[Import Job Hook] Checking if should queue job',
        transactionID: req.transactionID,
      })
    }

    if (disableJobsQueue) {
      if (pluginConfig.debug) {
        req.payload.logger.info({
          docId: doc.id,
          msg: '[Import Job Hook] Skipping job queue (sync mode)',
        })
      }
      return
    }

    try {
      // Resolve maxLimit ahead of time since it may involve async config resolution
      const maxLimit = await resolveLimit({
        limit: targetPluginConfig?.importLimit,
        req,
      })
      const defaultVersionStatus =
        targetPluginConfig?.defaultVersionStatus ??
        importConfig?.defaultVersionStatus ??
        pluginConfig.defaultVersionStatus ??
        FALLBACK_VERSION_STATUS
      const batchSize =
        targetPluginConfig?.importBatchSize ??
        importConfig?.batchSize ??
        pluginConfig.batchSize ??
        FALLBACK_BATCH_SIZE

      const input: ImportTaskInput = {
        batchSize,
        debug: pluginConfig.debug,
        defaultVersionStatus,
        importCollection: collectionConfig.slug,
        importId: doc.id,
        maxLimit,
        userCollection: req.user?.collection || req?.user?.user?.collection,
        userID: req?.user?.id || req?.user?.user?.id,
      }

      await req.payload.jobs.queue({
        input,
        task: 'createCollectionImport',
      })
    } catch (err) {
      req.payload.logger.error({
        err,
        msg: `Failed to queue import job for document ${doc.id}`,
      })
    }
  })

  return collection
}
