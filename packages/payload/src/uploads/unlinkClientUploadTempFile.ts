import fs from 'fs/promises'

import type { PayloadRequest } from '../types/index.js'

import { CLIENT_UPLOAD_TEMP_FILE_PATH_CONTEXT_KEY } from './getFileFromClientUpload.js'

type Args = {
  /**
   * A path the caller has already removed, so the redundant unlink is skipped.
   */
  alreadyUnlinkedPath?: string
  req: PayloadRequest
}

/**
 * Removes the temp file a client upload materialized, if it is still on disk. Logs rather than
 * throws, so cleanup can never replace a response or mask the error that a caller is handling.
 *
 * The path is tracked on `req.context` rather than read back off `req.file` because the file
 * can outlive both: plugin-cloud-storage's afterChange hook clears `req.file` before cleanup
 * runs, and the request parser materializes the file for whatever `collectionSlug` the multipart
 * field names, which does not have to be a collection the endpoint writes a document to.
 */
export const unlinkClientUploadTempFile: (args: Args) => Promise<void> = async ({
  alreadyUnlinkedPath,
  req,
}) => {
  const tempFilePath = req.context?.[CLIENT_UPLOAD_TEMP_FILE_PATH_CONTEXT_KEY]

  if (typeof tempFilePath !== 'string') {
    return
  }

  delete req.context[CLIENT_UPLOAD_TEMP_FILE_PATH_CONTEXT_KEY]

  if (tempFilePath === alreadyUnlinkedPath) {
    return
  }

  try {
    await fs.unlink(tempFilePath)
  } catch (error) {
    req.payload.logger.error({ err: error, msg: 'Failed to remove client upload temp file' })
  }
}
