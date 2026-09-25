import type { PayloadRequest } from '../../types/index.js'

/**
 * Sets `req.fileTransform = true` for the duration of `callback()` when
 * `isTransform` is `true`, then restores the previous value afterward, even
 * if `callback()` throws. Ordinary reads (`isTransform: false`) never see the
 * flag set.
 */
export async function withFileTransformAccessContext<T>({
  callback,
  isTransform,
  req,
}: {
  callback: () => Promise<T> | T
  isTransform: boolean
  req: PayloadRequest
}): Promise<T> {
  const previousFileTransform = req.fileTransform

  if (isTransform) {
    req.fileTransform = true
  }

  try {
    return await callback()
  } finally {
    req.fileTransform = previousFileTransform
  }
}
