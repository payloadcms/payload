import type { Config, TaskConfig } from 'payload'

import { FileRetrievalError } from 'payload'

import { getFileFromDoc } from '../utilities/getFileFromDoc.js'
import { createImport } from './createImport.js'

export type ImportTaskInput = {
  batchSize?: number
  debug?: boolean
  defaultVersionStatus?: 'draft' | 'published'
  importCollection: string
  importId: string
  maxLimit?: number
  userCollection?: string
  userID?: number | string
}

export const getCreateCollectionImportTask = (
  _config: Config,
): TaskConfig<{
  input: ImportTaskInput
  output: object
}> => {
  return {
    slug: 'createCollectionImport',
    handler: async ({ input, req }) => {
      const {
        batchSize,
        debug,
        defaultVersionStatus,
        importCollection,
        importId,
        maxLimit,
        userCollection,
        userID,
      } = input

      // Fetch the import document to get all necessary data
      const importDoc = await req.payload.findByID({
        id: importId,
        collection: importCollection,
      })

      if (!importDoc) {
        throw new Error(`Import document not found: ${importId}`)
      }

      // Get the collection config for the imports collection
      const collectionConfig = req.payload.config.collections.find(
        (c) => c.slug === importCollection,
      )

      if (!collectionConfig) {
        throw new Error(`Collection config not found for: ${importCollection}`)
      }

      // Retrieve the file using getFileFromDoc (handles both local and cloud storage)
      const file = await getFileFromDoc({
        collectionConfig,
        doc: {
          filename: importDoc.filename as string,
          mimeType: importDoc.mimeType as string | undefined,
          url: importDoc.url as string | undefined,
        },
        req,
      })

      const fileMimetype = file.mimetype || (importDoc.mimeType as string)

      if (!fileMimetype) {
        throw new FileRetrievalError(
          req.t,
          `Unable to determine mimetype for file: ${importDoc.filename}`,
        )
      }

      const result = await createImport({
        name: (importDoc.filename as string) || 'import',
        batchSize,
        collectionSlug: importDoc.collectionSlug as string,
        debug,
        defaultVersionStatus,
        file: {
          name: importDoc.filename as string,
          data: file.data,
          mimetype: fileMimetype,
        },
        format: fileMimetype === 'text/csv' ? 'csv' : 'json',
        importMode: (importDoc.importMode as 'create' | 'update' | 'upsert') || 'create',
        matchField: importDoc.matchField as string | undefined,
        maxLimit,
        req,
        userCollection,
        userID,
      })

      // Update the import document with results
      await req.payload.update({
        id: importId,
        collection: importCollection,
        data: {
          status:
            result.errors.length === 0
              ? 'completed'
              : result.imported + result.updated === 0
                ? 'failed'
                : 'partial',
          summary: {
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
          },
        },
      })

      return {
        output: result,
      }
    },
    inputSchema: [
      {
        name: 'importId',
        type: 'text',
        required: true,
      },
      {
        name: 'importCollection',
        type: 'text',
        required: true,
      },
      {
        name: 'userID',
        type: 'text',
      },
      {
        name: 'userCollection',
        type: 'text',
      },
      {
        name: 'batchSize',
        type: 'number',
      },
      {
        name: 'debug',
        type: 'checkbox',
      },
      {
        name: 'defaultVersionStatus',
        type: 'select',
        options: ['draft', 'published'],
      },
      {
        name: 'maxLimit',
        type: 'number',
      },
    ],
  }
}
