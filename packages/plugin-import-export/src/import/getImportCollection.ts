import type {
  CollectionAfterChangeHook,
  CollectionBeforeOperationHook,
  CollectionConfig,
  Config,
} from 'payload'

import type { ImportConfig, ImportExportPluginConfig, Limit } from '../types.js'
import type { ImportTaskInput } from './getCreateImportCollectionTask.js'

import { getFileFromDoc } from '../utilities/getFileFromDoc.js'
import { resolveLimit } from '../utilities/resolveLimit.js'
import { createImport } from './createImport.js'
import { getFields } from './getFields.js'
import { handlePreview } from './handlePreview.js'

export const getImportCollection = ({
  collectionSlugs,
  config,
  importConfig,
  pluginConfig,
}: {
  /**
   * Collection slugs that this import collection supports.
   */
  collectionSlugs: string[]
  config: Config
  importConfig?: ImportConfig
  pluginConfig: ImportExportPluginConfig
}): CollectionConfig => {
  const beforeOperation: CollectionBeforeOperationHook[] = []
  const afterChange: CollectionAfterChangeHook[] = []

  // Extract import-specific settings
  const disableJobsQueue = importConfig?.disableJobsQueue ?? false
  const batchSize = importConfig?.batchSize ?? 100
  const defaultVersionStatus = importConfig?.defaultVersionStatus ?? 'published'

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
      beforeOperation,
    },
    lockDocuments: false,
    upload: {
      filesRequiredOnCreate: true,
      hideFileInputOnCreate: false,
      hideRemoveFile: true,
      mimeTypes: ['text/csv', 'application/json'],
    },
  }

  if (disableJobsQueue) {
    // Process the import synchronously after the document (with file) has been created
    afterChange.push(async ({ collection: collectionConfig, doc, operation, req }) => {
      if (operation !== 'create' || doc.status !== 'pending') {
        return doc
      }

      const debug = pluginConfig.debug || false

      try {
        // Get file data from the uploaded document
        // First try req.file which is available during the same request (especially important for cloud storage)
        // Fall back to getFileFromDoc for cases where req.file isn't available
        let fileData: Buffer
        let fileMimetype: string

        if (req.file?.data) {
          fileData = req.file.data
          fileMimetype = req.file.mimetype || doc.mimeType || 'text/csv'
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

        const targetCollection = req.payload.collections[doc.collectionSlug]
        const importLimitConfig: Limit | undefined =
          targetCollection?.config.custom?.['plugin-import-export']?.importLimit
        const maxLimit = await resolveLimit({
          limit: importLimitConfig,
          req,
        })

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

        // Try to update the document with results (may fail due to transaction timing)
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
          // Update may fail if document not yet committed, log but continue
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

        // Try to update document with error status
        try {
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
        } catch (updateErr) {
          // Update may fail if document not yet committed, log but continue
          if (debug) {
            req.payload.logger.error({
              err: updateErr,
              msg: `Failed to update import document ${doc.id} with error status`,
            })
          }
        }

        if (debug) {
          req.payload.logger.error({
            err,
            msg: 'Import processing failed',
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
  } else {
    // When jobs queue is enabled, queue the import as a job
    // The job handler will fetch the file from storage using getFileFromDoc
    afterChange.push(async ({ collection: collectionConfig, doc, operation, req }) => {
      if (operation !== 'create') {
        return
      }

      try {
        // Resolve maxLimit ahead of time since it may involve async config resolution
        const targetCollection = req.payload.collections[doc.collectionSlug]
        const importLimitConfig: Limit | undefined =
          targetCollection?.config.custom?.['plugin-import-export']?.importLimit
        const maxLimit = await resolveLimit({
          limit: importLimitConfig,
          req,
        })

        // Only pass minimal data to the job - the handler will fetch the file from storage
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
  }

  return collection
}
