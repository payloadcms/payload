import type { Readable } from 'stream'

/** Full local content, or an original still held by a client-upload provider. */
export type FileContent =
  | { buffer: Buffer; type: 'buffer' }
  | { ownership: 'external' | 'temporary'; path: string; type: 'file' }
  | { probe?: Buffer; size: number; type: 'clientUpload' }

export type FileContentToSave = { content: FileContent; path: string }

type LegacyContent = {
  buffer?: Buffer
  clientUploadContext?: unknown
  content?: FileContent
  data?: Buffer
  size?: number
  tempFilePath?: string
}
type FileContentSource = FileContent | LegacyContent

// Track legacy views without adding competing source fields to public request files.
const legacyContent = new WeakMap<
  object,
  { buffer?: Buffer; content: FileContent; data?: Buffer; tempFilePath?: string }
>()

export function getFileContent(
  file: FileContentSource,
  ownership: 'external' | 'temporary' = 'external',
): FileContent {
  if ('type' in file) {
    return file
  }
  if (file.content) {
    return file.content
  }

  const tracked = legacyContent.get(file)
  if (
    tracked &&
    tracked.data === file.data &&
    tracked.buffer === file.buffer &&
    tracked.tempFilePath === file.tempFilePath
  ) {
    return tracked.content
  }
  if (file.tempFilePath) {
    return { type: 'file', ownership, path: file.tempFilePath }
  }

  const buffer = file.data ?? file.buffer
  if (!buffer) {
    throw new Error('Expected file content, a buffer, or a file path.')
  }
  // A hook may clone a public file and lose its WeakMap association. Stay conservative:
  // a client reference without a local path does not establish that its bytes are complete.
  if (file.clientUploadContext) {
    return { type: 'clientUpload', probe: buffer.length ? buffer : undefined, size: file.size ?? 0 }
  }
  return { type: 'buffer', buffer }
}

export function bindLegacyFileContent<T extends LegacyContent>(file: T, content: FileContent): T {
  legacyContent.set(file, {
    buffer: file.buffer,
    content,
    data: file.data,
    tempFilePath: file.tempFilePath,
  })
  return file
}

/** Processors receive complete bytes, never a header probe. */
export function getFileInput(file: FileContentSource): Buffer | string {
  const content = requireCompleteContent(file)
  return content.type === 'file' ? content.path : content.buffer
}

/** A bounded probe is sufficient for inspection, but is not a complete file. */
export function getFileInspectionInput(file: FileContentSource): Buffer | string {
  const content = getFileContent(file)
  if (content.type === 'clientUpload') {
    return content.probe ?? Buffer.alloc(0)
  }
  return content.type === 'file' ? content.path : content.buffer
}

export async function getFileBuffer(file: FileContentSource): Promise<Buffer> {
  const content = requireCompleteContent(file)
  if (content.type === 'buffer') {
    return content.buffer
  }
  const fs = await import('fs/promises')
  return fs.default.readFile(content.path)
}

export async function getFileStream(file: FileContentSource): Promise<Readable> {
  const content = requireCompleteContent(file)
  if (content.type === 'file') {
    const { createReadStream } = await import('fs')
    return createReadStream(content.path)
  }
  const { Readable } = await import('stream')
  return Readable.from([content.buffer])
}

export async function getFileBlob(file: FileContentSource, type?: string): Promise<Blob> {
  const content = requireCompleteContent(file)
  if (content.type === 'buffer') {
    return new Blob([content.buffer], { type })
  }
  // Workers require filesystem compatibility to use temp files, so keep this import conditional.
  const { openAsBlob } = await import('fs')
  return openAsBlob(content.path, { type })
}

export async function getFileSize(file: FileContentSource): Promise<number> {
  const content = getFileContent(file)
  if (content.type === 'clientUpload') {
    return content.size
  }
  if (content.type === 'buffer') {
    return content.buffer.length
  }
  const fs = await import('fs/promises')
  return (await fs.default.stat(content.path)).size
}

/** Replace owned content; borrowed source files are never overwritten while processing. */
export async function replaceFileContent<T extends { content: FileContent; size: number }>(
  file: T,
  data: Buffer,
): Promise<T> {
  let content: FileContent = { type: 'buffer', buffer: data }
  if (file.content.type === 'file' && file.content.ownership === 'temporary') {
    const fs = await import('fs/promises')
    await fs.default.writeFile(file.content.path, data)
    content = file.content
  }
  return { ...file, content, size: data.length }
}

export async function saveFileContent(file: FileContentSource, destination: string): Promise<void> {
  const content = requireCompleteContent(file)
  const fs = await import('fs/promises')
  if (content.type === 'buffer') {
    await fs.default.writeFile(destination, content.buffer)
  } else {
    const path = await import('path')
    if (path.default.resolve(content.path) !== path.default.resolve(destination)) {
      await fs.default.copyFile(content.path, destination)
    }
  }
}

/** Cleanup is idempotent and never removes borrowed files. */
export async function disposeFileContent(file: FileContentSource): Promise<void> {
  const content = getFileContent(file)
  if (content.type !== 'file' || content.ownership !== 'temporary') {
    return
  }
  const fs = await import('fs/promises')
  try {
    await fs.default.unlink(content.path)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
  }
}

function requireCompleteContent(file: FileContentSource) {
  const content = getFileContent(file)
  if (content.type === 'clientUpload') {
    throw new Error(
      'Client upload must be materialized before reading or processing its full content.',
    )
  }
  return content
}
