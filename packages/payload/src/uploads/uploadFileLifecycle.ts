import type { PayloadRequest } from '../types/index.js'
import type { FileContent } from './fileContent.js'

import { disposeFileContent } from './fileContent.js'

type UploadFileLifecycle = {
  contextKeys: Set<string>
  depth: number
  files: Map<string, FileContent>
}

const contextKey = 'payloadUploadFileLifecycle'

/** Track ownership independently of req.file, which hooks may replace or clear. */
export function registerUploadFile({
  content,
  contextKey: key,
  req,
}: {
  content: FileContent
  contextKey?: string
  req: PayloadRequest
}): void {
  if (content.type !== 'file' || content.ownership !== 'temporary') {
    return
  }

  const lifecycle = getLifecycle(req)
  lifecycle.files.set(content.path, content)
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

  for (const content of files) {
    try {
      await disposeFileContent(content)
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
    files: new Map<string, FileContent>(),
  }) as UploadFileLifecycle
}
