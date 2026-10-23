import type { FileSource } from './fileSource.js'
import type { File } from './types.js'

import { bindLegacyFileSource, getFileSource } from './fileSource.js'

/** Internal state; public request files remain legacy views of this source. */
export type UploadFile = {
  clientUploadContext?: unknown
  mimetype: string
  name: string
  size: number
  source: FileSource
}

type LegacyUploadFile = { clientUploadContext?: unknown } & File

/** Prepare a caller-supplied file without transferring ownership to Payload. */
export function prepareLocalUploadFile(file: LegacyUploadFile): LegacyUploadFile {
  return toLegacyUploadFile(normalizeUploadFile(file), file)
}

export function normalizeUploadFile(
  file: LegacyUploadFile | UploadFile,
  isTemporary = false,
): UploadFile {
  return {
    name: file.name,
    clientUploadContext: file.clientUploadContext,
    mimetype: file.mimetype,
    size: file.size,
    source: getFileSource(file, isTemporary),
  }
}

/** Preserve the public shape, including custom properties attached by user hooks. */
export function toLegacyUploadFile(
  file: UploadFile,
  original?: LegacyUploadFile,
): LegacyUploadFile {
  const { source } = file
  const legacy: LegacyUploadFile = {
    ...original,
    name: file.name,
    data:
      source.type === 'buffer'
        ? source.buffer
        : source.type === 'clientUpload'
          ? (source.probe ?? Buffer.alloc(0))
          : Buffer.alloc(0),
    mimetype: file.mimetype,
    size: file.size,
  }
  if (source.type === 'file') {
    legacy.tempFilePath = source.path
  } else {
    delete legacy.tempFilePath
  }
  if (file.clientUploadContext !== undefined) {
    legacy.clientUploadContext = file.clientUploadContext
  } else {
    delete legacy.clientUploadContext
  }
  return bindLegacyFileSource(legacy, source)
}
