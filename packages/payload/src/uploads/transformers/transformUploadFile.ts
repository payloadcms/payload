import type { PayloadRequest } from '../../types/index.js'
import type { UploadTransformer } from './types.js'

/**
 * Runs one file through every eligible `transformFile` stage in declaration
 * order. Used both for the ordinary top-level upload call (`options: undefined`)
 * and, via the private v4 bridge's `transform` callback, once per legacy task
 * (the main file, crop output, or a named image size) with that task's own
 * `options`. Retains only the current accumulator — never a history array —
 * so passing the same `File` through unchanged never copies its buffer.
 */
export async function transformUploadFile({
  collectionSlug,
  file,
  options,
  pipeline,
  req,
}: {
  collectionSlug: string
  file: File
  options: unknown
  pipeline: UploadTransformer[]
  req: PayloadRequest
}): Promise<File> {
  let accumulator = file

  for (const transformer of pipeline) {
    if (typeof transformer.transformFile !== 'function') {
      continue
    }

    const result = await transformer.transformFile({
      collectionSlug,
      file: accumulator,
      options,
      req,
    })

    if (result.file) {
      accumulator = result.file
    }

    if (result.status === 'complete') {
      return accumulator
    }
  }

  return accumulator
}
