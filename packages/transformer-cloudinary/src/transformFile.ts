import type { TransformFileArgs, TransformFileResult } from 'payload'

import type { DebugLog } from './debugLog.js'
import type { CloudinaryUploadTaskOptions } from './types.js'

import { formatElapsed } from './debugLog.js'

/**
 * This package's one-file-in/one-file-out upload primitive. All of the decision-making
 * happened in `prepareUpload`, which already resolved the derived asset's URL - this
 * stage only pulls those bytes back. Never writes to storage.
 */
export function createTransformFile({
  debugLog,
}: {
  debugLog: DebugLog
}): (
  args: TransformFileArgs<CloudinaryUploadTaskOptions | undefined>,
) => Promise<TransformFileResult> {
  return async ({ file, options, req }) => {
    if (!options?.derivedURL) {
      return { status: 'continue' }
    }

    const startedAt = Date.now()
    const response = await fetch(options.derivedURL, { signal: req.signal })

    debugLog({
      msg: `GET derived asset ${options.derivedURL} -> ${response.status} in ${formatElapsed(startedAt)}`,
      req,
    })

    if (!response.ok) {
      throw new Error(
        `Cloudinary returned ${response.status} for the derived asset "${options.derivedURL}".`,
      )
    }

    const bytes = Buffer.from(await response.arrayBuffer())

    return {
      file: new File([bytes], file.name, {
        type: response.headers.get('content-type') ?? options.mimeType,
      }),
      status: 'continue',
    }
  }
}
