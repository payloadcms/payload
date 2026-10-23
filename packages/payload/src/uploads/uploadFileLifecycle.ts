import type { PayloadRequest } from '../types/index.js'
import type { FileSource } from './fileSource.js'

import { deleteTempFile } from './fileSource.js'

type UploadFileLifecycle = {
  contextKeys: Set<string>
  depth: number
  files: Map<string, FileSource>
}

const contextKey = 'payloadUploadFileLifecycle'

/** Track ownership independently of req.file, which hooks may replace or clear. */
export function registerTempFile({
  contextKey: key,
  req,
  source,
}: {
  contextKey?: string
  req: PayloadRequest
  source: FileSource
}): void {
  if (source.type !== 'file' || !source.isTemporary) {
    return
  }

  const lifecycle = getLifecycle(req)
  lifecycle.files.set(source.path, source)
  if (key) {
    lifecycle.contextKeys.add(key)
  }
}

/** Nested Local API calls share ownership; only the outer scope releases the files. */
export async function withUploadFileScope<T>(
  req: PayloadRequest,
  operation: () => Promise<T>,
): Promise<T> {
  const lifecycle = getLifecycle(req)
  lifecycle.depth++

  try {
    return await operation()
  } finally {
    lifecycle.depth--
    await cleanupUploadFiles(req)
  }
}

export async function cleanupUploadFiles(req: PayloadRequest): Promise<void> {
  const lifecycle = req.context?.[contextKey] as undefined | UploadFileLifecycle
  if (!lifecycle || lifecycle.depth > 0) {
    return
  }

  delete req.context[contextKey]
  for (const key of lifecycle.contextKeys) {
    delete req.context[key]
  }

  const files = [...lifecycle.files.values()]
  lifecycle.files.clear()
  lifecycle.contextKeys.clear()

  for (const source of files) {
    try {
      await deleteTempFile(source)
    } catch (error) {
      // Cleanup must not replace the operation's response or its original error.
      req.payload.logger.error({ err: error, msg: 'Failed to remove upload temp file' })
    }
  }
}

function getLifecycle(req: PayloadRequest): UploadFileLifecycle {
  req.context ??= {}
  return (req.context[contextKey] ??= {
    contextKeys: new Set<string>(),
    depth: 0,
    files: new Map<string, FileSource>(),
  }) as UploadFileLifecycle
}
