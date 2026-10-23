import type { Readable } from 'stream'

/** Full local source, or an original still held by a client-upload provider. */
export type FileSource =
  | { buffer: Buffer; type: 'buffer' }
  | { ownership: 'external' | 'temporary'; path: string; type: 'file' }
  | { probe?: Buffer; size: number; type: 'clientUpload' }

export type FileSourceToSave = { path: string; source: FileSource }

type LegacyFileSource = {
  buffer?: Buffer
  clientUploadContext?: unknown
  data?: Buffer
  size?: number
  source?: FileSource
  tempFilePath?: string
}
type FileSourceInput = FileSource | LegacyFileSource

// Track legacy views without adding competing source fields to public request files.
const legacySources = new WeakMap<
  object,
  { buffer?: Buffer; data?: Buffer; source: FileSource; tempFilePath?: string }
>()

export function getFileSource(
  file: FileSourceInput,
  ownership: 'external' | 'temporary' = 'external',
): FileSource {
  if ('type' in file) {
    return file
  }
  if (file.source) {
    return file.source
  }

  const tracked = legacySources.get(file)
  if (
    tracked &&
    tracked.data === file.data &&
    tracked.buffer === file.buffer &&
    tracked.tempFilePath === file.tempFilePath
  ) {
    return tracked.source
  }
  if (file.tempFilePath) {
    return { type: 'file', ownership, path: file.tempFilePath }
  }

  const buffer = file.data ?? file.buffer
  if (!buffer) {
    throw new Error('Expected file source, a buffer, or a file path.')
  }
  // A hook may clone a public file and lose its WeakMap association. Stay conservative:
  // a client reference without a local path does not establish that its bytes are complete.
  if (file.clientUploadContext) {
    return { type: 'clientUpload', probe: buffer.length ? buffer : undefined, size: file.size ?? 0 }
  }
  return { type: 'buffer', buffer }
}

export function bindLegacyFileSource<T extends LegacyFileSource>(file: T, source: FileSource): T {
  legacySources.set(file, {
    buffer: file.buffer,
    data: file.data,
    source,
    tempFilePath: file.tempFilePath,
  })
  return file
}

/** Processors receive complete bytes, never a header probe. */
export function getFileInput(file: FileSourceInput): Buffer | string {
  const source = requireCompleteSource(file)
  return source.type === 'file' ? source.path : source.buffer
}

/** A bounded probe is sufficient for inspection, but is not a complete file. */
export function getFileInspectionInput(file: FileSourceInput): Buffer | string {
  const source = getFileSource(file)
  if (source.type === 'clientUpload') {
    return source.probe ?? Buffer.alloc(0)
  }
  return source.type === 'file' ? source.path : source.buffer
}

export async function getFileBuffer(file: FileSourceInput): Promise<Buffer> {
  const source = requireCompleteSource(file)
  if (source.type === 'buffer') {
    return source.buffer
  }
  const fs = await import('fs/promises')
  return fs.default.readFile(source.path)
}

export async function getFileStream(file: FileSourceInput): Promise<Readable> {
  const source = requireCompleteSource(file)
  if (source.type === 'file') {
    const { createReadStream } = await import('fs')
    return createReadStream(source.path)
  }
  const { Readable } = await import('stream')
  return Readable.from([source.buffer])
}

export async function getFileBlob(file: FileSourceInput, type?: string): Promise<Blob> {
  const source = requireCompleteSource(file)
  if (source.type === 'buffer') {
    return new Blob([source.buffer], { type })
  }
  // Workers require filesystem compatibility to use temp files, so keep this import conditional.
  const { openAsBlob } = await import('fs')
  return openAsBlob(source.path, { type })
}

export async function getFileSize(file: FileSourceInput): Promise<number> {
  const source = getFileSource(file)
  if (source.type === 'clientUpload') {
    return source.size
  }
  if (source.type === 'buffer') {
    return source.buffer.length
  }
  const fs = await import('fs/promises')
  return (await fs.default.stat(source.path)).size
}

/** Replace owned source; borrowed source files are never overwritten while processing. */
export async function replaceFileSource<T extends { size: number; source: FileSource }>(
  file: T,
  data: Buffer,
): Promise<T> {
  let source: FileSource = { type: 'buffer', buffer: data }
  if (file.source.type === 'file' && file.source.ownership === 'temporary') {
    const fs = await import('fs/promises')
    await fs.default.writeFile(file.source.path, data)
    source = file.source
  }
  return { ...file, size: data.length, source }
}

export async function saveFileSource(file: FileSourceInput, destination: string): Promise<void> {
  const source = requireCompleteSource(file)
  const fs = await import('fs/promises')
  if (source.type === 'buffer') {
    await fs.default.writeFile(destination, source.buffer)
  } else {
    const path = await import('path')
    if (path.default.resolve(source.path) !== path.default.resolve(destination)) {
      await fs.default.copyFile(source.path, destination)
    }
  }
}

/** Cleanup is idempotent and never removes borrowed files. */
export async function disposeFileSource(file: FileSourceInput): Promise<void> {
  const source = getFileSource(file)
  if (source.type !== 'file' || source.ownership !== 'temporary') {
    return
  }
  const fs = await import('fs/promises')
  try {
    await fs.default.unlink(source.path)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
  }
}

function requireCompleteSource(file: FileSourceInput) {
  const source = getFileSource(file)
  if (source.type === 'clientUpload') {
    throw new Error(
      'Client upload must be materialized before reading or processing its full source.',
    )
  }
  return source
}
