import type { TransformFileArgs, TransformFileResult } from 'payload'

import type { CloudinaryUploadTaskOptions } from './types.js'

/**
 * This package's one-file-in/one-file-out upload primitive. All of the decision-making
 * happened in `prepareUpload`, which already resolved the derived asset's URL - this
 * stage only pulls those bytes back. Never writes to storage.
 */
export async function transformFile({
  file,
  options,
  req,
}: TransformFileArgs<CloudinaryUploadTaskOptions | undefined>): Promise<TransformFileResult> {
  if (!options?.derivedURL) {
    return { status: 'continue' }
  }

  const response = await fetch(options.derivedURL, { signal: req.signal })

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
