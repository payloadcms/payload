import type {
  CollectionAfterChangeHook,
  CollectionBeforeChangeHook,
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
  const beforeChange: CollectionBeforeChangeHook[] = []
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
      beforeChange,
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
    // Process the import after the document (with file) has been created
    afterChange.push(async ({ doc, operation, req }) => {
      if (operation !== 'create') {
        return doc
      }

      // Only process if status is still pending
      if (doc.status !== 'pending') {
        return doc
      }

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
            debug: pluginConfig.debug || false,
            file: {
              name: doc.filename,
              data: fileData,
              mimetype: fileMimetype,
            },
            format: fileMimetype === 'text/csv' ? 'csv' : 'json',
            importMode: doc.importMode || 'create',
            matchField: doc.matchField,
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

        // Update the document with results
        // Store on doc object for immediate return
        doc.status = status
        doc.summary = {
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

        // Schedule update after transaction completes

        try {
          await req.payload.update({
            id: doc.id,
            collection: collection.slug,
            data: {
              status,
              summary: doc.summary,
            },
            overrideAccess: true,
            req,
          })
        } catch (updateErr) {
          req.payload.logger.error({
            err: updateErr,
            msg: `Failed to update import document ${doc.id} with results`,
          })
        }

        return doc
      } catch (err) {
        // Store error status on doc for immediate return
        doc.status = 'failed'
        doc.summary = {
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

        try {
          await req.payload.update({
            id: doc.id,
            collection: collection.slug,
            data: {
              status: 'failed',
              summary: doc.summary,
            },
            overrideAccess: true,
            req,
          })
        } catch (updateErr) {
          req.payload.logger.error({
            err: updateErr,
            msg: `Failed to update import document ${doc.id} with error status`,
          })
        }

        return doc
      }
    })
  } else {
    // When jobs queue is enabled, queue the import as a job
    afterChange.push(async ({ doc, operation, req }) => {
      if (operation !== 'create') {
        return doc
      }

      try {
        // Get file data for job
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

        // Return doc with pending status for jobs
        return {
          ...doc,
          status: 'pending',
        }
      } catch (err) {
        // Return document with error status
        return {
          ...doc,
          status: 'failed',
          summary: {
            imported: 0,
            issueDetails: [
              {
                data: {},
                error: `Failed to queue job: ${err instanceof Error ? err.message : String(err)}`,
                row: 0,
              },
            ],
            issues: 1,
            total: 0,
            updated: 0,
          },
        }
      }
    })
  }

  return collection
}
