import type { CollectionBeforeChangeHook, FileData } from 'payload'
import type { TypeWithID } from 'payload/shared'

/**
 * Preserves req.file in req.context and ensures nested calls don't overwrite the original file data.
 */
export const getPreserveFileDataHook =
  (): CollectionBeforeChangeHook<FileData & TypeWithID> =>
  ({ req }) => {
    if (req.file && !req.context?._payloadCloudStorage) {
      req.context = req.context || {}
      req.context._payloadCloudStorage = {
        file: req.file,
        uploadSizes: req.payloadUploadSizes,
      }
    }
  }
