import type { PayloadRequest } from '../../types/index.js'

/**
 * Sets `req.fileTransform = true` for the duration of `run()` when `isTransform`
 * is `true`, then restores whatever value the request carried before — including
 * when `run()` throws or rejects. Ordinary reads (`isTransform: false`) never see
 * the flag set.
 */
export async function withFileTransformAccessContext<T>({
  isTransform,
  req,
  run,
}: {
  isTransform: boolean
  req: PayloadRequest
  run: () => Promise<T> | T
}): Promise<T> {
  const previousFileTransform = req.fileTransform

  if (isTransform) {
    req.fileTransform = true
  }

  try {
    return await run()
  } finally {
    req.fileTransform = previousFileTransform
  }
}
