import type { SanitizedCollectionConfig, TypeWithID } from '../../../collections/config/types.js'
import type { PayloadRequest } from '../../../types/index.js'
import type { UploadSource } from './selectUploadSource.js'

import { FileRetrievalError, Forbidden } from '../../../errors/index.js'
import { downloadFileToBuffer, resolveExternalFileURL } from '../../downloadFileToBuffer.js'
import { getFileByPath } from '../../getFileByPath.js'
import { validateUploadURL } from '../../validateUploadURL.js'
import { getStoredOriginal } from './selectUploadSource.js'

/**
 * Reads the bytes of a source that did not arrive with the operation: a stored local file, a
 * stored original in managed cloud storage, or a remote URL. Checks the path and the URL policy
 * before anything is read.
 */
export async function readUploadSource({
  collection,
  currentFilename,
  originalDoc,
  req,
  source,
  storedMimeType,
}: {
  collection: SanitizedCollectionConfig
  /** The main file's name. A file read from the retained original keeps it. */
  currentFilename?: string
  originalDoc: unknown
  req: PayloadRequest
  source: Exclude<UploadSource, { type: 'newUpload' } | { type: 'none' }>
  /** The saved MIME type, used when the read file's type cannot be detected. */
  storedMimeType?: string
}): Promise<{
  file?: NonNullable<PayloadRequest['file']>
  /** Set when a file was read. True when the read file replaces the stored one. */
  shouldOverwriteExistingFiles?: boolean
}> {
  const { serverURL } = req.payload.config
  const { disableLocalStorage, staticDir } = collection.upload
  const storedOriginal = getStoredOriginal({ source })
  const externalUploadSource = source.type === 'externalURL' ? source.fileData : undefined
  const fileData =
    source.type === 'documentFile' || source.type === 'externalURL'
      ? source.fileData
      : source.original
  const { filename, url } = fileData

  if (filename && (filename.includes('../') || filename.includes('..\\'))) {
    throw new Forbidden(req.t)
  }

  const isLocalFile = Boolean((serverURL && url?.startsWith(serverURL)) || url?.startsWith('/'))

  // A caller-supplied URL must pass the same `pasteURL` policy as the paste-url endpoint.
  // Checked outside the try below so policy errors reach the caller as 400s.
  if (externalUploadSource) {
    validateUploadURL({
      requireAllowList: false,
      uploadConfig: collection.upload,
      url: resolveExternalFileURL({ req, url: externalUploadSource.url }).url.href,
    })
  }

  let file: NonNullable<PayloadRequest['file']> | undefined
  let shouldOverwriteExistingFiles: boolean | undefined

  try {
    if (!externalUploadSource && !disableLocalStorage && isLocalFile) {
      // File is stored locally
      file = await getFileByPath(`${staticDir}/${filename}`)
      shouldOverwriteExistingFiles = true
    } else if (filename && storedOriginal && collection.upload.fileOperations) {
      const { retrieveFileResponse } = await import('../../endpoints/getFile.js')
      const response = await retrieveFileResponse({
        collection: { config: collection },
        doc: originalDoc as TypeWithID,
        filename,
        isOriginal: true,
        operation: 'transform',
        req,
      })

      if (!response.ok) {
        throw new Error(`Unable to read retained original ${filename}`)
      }

      const buffer = Buffer.from(await response.arrayBuffer())
      file = {
        name: filename,
        data: buffer,
        mimetype: storedOriginal.mimeType,
        size: buffer.length,
      }
      shouldOverwriteExistingFiles = true
    } else if (filename && url) {
      // File is remote
      file = await downloadFileToBuffer({ data: fileData, req, uploadConfig: collection.upload })
      shouldOverwriteExistingFiles = !externalUploadSource
    }
  } catch (err: unknown) {
    throw new FileRetrievalError(req.t, err instanceof Error ? err.message : undefined)
  }

  // A stored file whose type cannot be detected from its bytes or extension keeps the type
  // saved on the document.
  if (file && !file.mimetype && storedMimeType) {
    file = { ...file, mimetype: storedMimeType }
  }

  if (file && source.type === 'retainedOriginal' && currentFilename) {
    file = { ...file, name: currentFilename }
  }

  return { file, shouldOverwriteExistingFiles }
}
