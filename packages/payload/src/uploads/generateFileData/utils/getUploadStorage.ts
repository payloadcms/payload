import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { PayloadRequest } from '../../../types/index.js'

/** An original that the client uploaded to the storage provider itself. */
export type ProviderOriginal = {
  _objectKey?: string
  filename: string
  key: string
  prefix?: string
}

/** Where the files of this upload are stored. */
export type UploadStorage = {
  /** The new file is kept as `original` only where it can be stored. */
  canStoreOriginal: boolean
  /** The collection's storage plugin manages its files (`upload.fileOperations`). */
  hasManagedCloudStorage: boolean
  /** Set when the client uploaded the file to the provider and its receipt was verified. */
  providerOriginal?: ProviderOriginal
  /** New files are staged for the managed storage, because the client did not upload them. */
  shouldStageCloudFiles: boolean
}

export function getUploadStorage({
  collection,
  file,
  req,
}: {
  collection: SanitizedCollectionConfig
  /** The new file of this operation, if any. */
  file: PayloadRequest['file']
  req: PayloadRequest
}): UploadStorage {
  const upload = collection.upload
  const hasManagedCloudStorage = Boolean(upload.fileOperations)
  const uploadReference = file?.uploadReference
  const hasProviderDirectReference =
    uploadReference && typeof uploadReference === 'object' && !('uploadId' in uploadReference)
  const verifiedOriginal = req.context?._payloadVerifiedProviderOriginal as
    | ({ signedReceipt: string } & ProviderOriginal)
    | undefined
  const providerOriginal =
    hasProviderDirectReference &&
    'signedReceipt' in uploadReference &&
    uploadReference.signedReceipt === verifiedOriginal?.signedReceipt &&
    verifiedOriginal &&
    typeof upload.adapter === 'string'
      ? {
          _objectKey: verifiedOriginal._objectKey,
          filename: verifiedOriginal.filename,
          key: verifiedOriginal.key,
          prefix: verifiedOriginal.prefix,
        }
      : undefined
  const shouldStageCloudFiles = hasManagedCloudStorage && !hasProviderDirectReference

  return {
    canStoreOriginal: Boolean(
      !upload.disableLocalStorage || shouldStageCloudFiles || providerOriginal,
    ),
    hasManagedCloudStorage,
    providerOriginal,
    shouldStageCloudFiles,
  }
}
