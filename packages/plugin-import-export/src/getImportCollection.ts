import type {
  CollectionAfterChangeHook,
  CollectionBeforeOperationHook,
  CollectionConfig,
  Config,
} from 'payload'

import fs from 'fs'
import path from 'path'

import type { CollectionOverride, ImportExportPluginConfig } from './types.js'

import { createImport } from './import/createImport.js'
import { getFields } from './import/getFields.js'

export const getImportCollection = ({
  config,
  pluginConfig,
}: {
  config: Config
  pluginConfig: ImportExportPluginConfig
}): CollectionConfig => {
  const { overrideImportCollection } = pluginConfig

  const beforeOperation: CollectionBeforeOperationHook[] = []
  const afterChange: CollectionAfterChangeHook[] = []

  let collection: CollectionOverride = {
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
      group: false,
      useAsTitle: 'filename',
    },
    disableDuplicate: true,
    fields: getFields(config, pluginConfig),
    hooks: {
      afterChange,
      beforeOperation,
    },
    upload: {
      filesRequiredOnCreate: true,
      hideFileInputOnCreate: false,
      hideRemoveFile: true,
      mimeTypes: ['text/csv', 'application/json'],
    },
  }

  if (typeof overrideImportCollection === 'function') {
    collection = overrideImportCollection(collection)
  }

  if (pluginConfig.disableJobsQueue) {
    // Process the import synchronously after the document (with file) has been created
    afterChange.push(async ({ doc, operation, req }) => {
      if (operation !== 'create' || doc.status !== 'pending') {
        return doc
      }

      const debug = pluginConfig.debug || false

      try {
        // Get file data from the uploaded document
        let fileData: Buffer
        let fileMimetype: string

        if (doc.url && doc.url.startsWith('http')) {
          // File has been uploaded to external storage (S3, etc.) - fetch it
          const response = await fetch(doc.url)
          if (!response.ok) {
            throw new Error(`Failed to fetch file from URL: ${doc.url}`)
          }
          fileData = Buffer.from(await response.arrayBuffer())
          fileMimetype = doc.mimeType || 'text/csv'
        } else {
          // File is stored locally - read from filesystem
          const filePath = doc.filename
          const uploadDir = collection.upload?.staticDir || './uploads'
          const fullPath = path.resolve(uploadDir, filePath)
          fileData = await fs.promises.readFile(fullPath)
          fileMimetype = doc.mimeType || 'text/csv'
        }

        const result = await createImport({
          batchSize: pluginConfig.batchSize || 100,
          defaultVersionStatus: pluginConfig.defaultVersionStatus || 'published',
          input: {
            id: doc.id,
            name: doc.filename || 'import',
            collectionSlug: doc.collectionSlug,
            debug,
            file: {
              name: doc.filename,
              data: fileData,
              mimetype: fileMimetype,
            },
            format: fileMimetype === 'text/csv' ? 'csv' : 'json',
            importMode: doc.importMode || 'create',
            matchField: doc.matchField,
            user: req?.user?.id || req?.user?.user?.id,
            userCollection: 'users',
          },
          req,
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
            collection: collection.slug,
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
            collection: collection.slug,
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
    afterChange.push(async ({ doc, operation, req }) => {
      if (operation !== 'create') {
        return
      }

      try {
        // Get file data for job - need to read from disk/URL since req.file is not available in afterChange
        let fileData: Buffer
        if (doc.url && doc.url.startsWith('http')) {
          const response = await fetch(doc.url)
          if (!response.ok) {
            throw new Error(`Failed to fetch file from URL: ${doc.url}`)
          }
          fileData = Buffer.from(await response.arrayBuffer())
        } else {
          const filePath = doc.filename
          const uploadDir = collection.upload?.staticDir || './uploads'
          const fullPath = path.resolve(uploadDir, filePath)
          fileData = await fs.promises.readFile(fullPath)
        }

        const input = {
          collectionSlug: doc.collectionSlug,
          debug: pluginConfig.debug,
          file: {
            name: doc.filename,
            data: fileData.toString('base64'),
            mimetype: doc.mimeType || 'text/csv',
          },
          filename: doc.filename,
          format: doc.mimeType === 'text/csv' ? 'csv' : 'json',
          importId: doc.id,
          importMode: doc.importMode || 'create',
          importsCollection: collection.slug,
          matchField: doc.matchField,
          user: req?.user?.id || req?.user?.user?.id,
          userCollection: 'users',
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
