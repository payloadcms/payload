import type { PayloadRequest } from '../../../types/index.js'
import type { ExternalUploadSource } from '../../sanitizeUploadData.js'
import type { FileData, OriginalFileData } from '../../types.js'

import { isRequestTimeFile } from '../../isRequestTimeFile.js'

/**
 * Where the file of this operation comes from. Only a new upload arrives with its bytes. The
 * other sources are read later, and only when the operation needs their bytes.
 */
export type UploadSource =
  /** A file sent with this operation. */
  | { file: NonNullable<PayloadRequest['file']>; type: 'newUpload' }
  /** A file at a URL the caller gave. */
  | { fileData: ExternalUploadSource; type: 'externalURL' }
  /** The file that a URL in the create data points at, or the stored main file. */
  | { fileData: FileData; type: 'documentFile' }
  /** The stored original of a request-time document that is duplicated. */
  | { original: OriginalFileData; type: 'duplicatedOriginal' }
  /** The stored original of the document that an update changes. */
  | { original: OriginalFileData; type: 'retainedOriginal' }
  /** No file. */
  | { type: 'none' }

export function selectUploadSource({
  currentFileData,
  externalUploadSource,
  isDuplicating,
  newFile,
  operation,
}: {
  /** The file data the document has before this operation. On a create, the incoming data. */
  currentFileData?: FileData
  externalUploadSource?: ExternalUploadSource
  isDuplicating?: boolean
  newFile: PayloadRequest['file']
  operation: 'create' | 'update'
}): UploadSource {
  if (newFile) {
    return { type: 'newUpload', file: newFile }
  }

  if (externalUploadSource) {
    return { type: 'externalURL', fileData: externalUploadSource }
  }

  if (
    operation === 'update' &&
    typeof currentFileData?.original?.filename === 'string' &&
    typeof currentFileData.original.url === 'string'
  ) {
    return { type: 'retainedOriginal', original: currentFileData.original }
  }

  // A copy of a dynamic upload starts from the source's original, because its default file has no
  // object.
  if (isDuplicating && isRequestTimeFile({ entry: currentFileData }) && currentFileData?.original) {
    return { type: 'duplicatedOriginal', original: currentFileData.original }
  }

  return currentFileData ? { type: 'documentFile', fileData: currentFileData } : { type: 'none' }
}

/** The stored original that the source reads, if it reads one. */
export function getStoredOriginal({
  source,
}: {
  source: UploadSource
}): OriginalFileData | undefined {
  return source.type === 'retainedOriginal' || source.type === 'duplicatedOriginal'
    ? source.original
    : undefined
}
