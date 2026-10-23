import type { FileContent } from './fileContent.js'
import type { File } from './types.js'

import { bindLegacyFileContent, getFileContent } from './fileContent.js'

/** Internal state; public request files remain legacy views of this content. */
export type UploadFile = {
  clientUploadContext?: unknown
  content: FileContent
  mimetype: string
  name: string
  size: number
}

type LegacyUploadFile = { clientUploadContext?: unknown } & File

/** Prepare a caller-supplied file without transferring ownership to Payload. */
export function prepareLocalUploadFile(file: LegacyUploadFile): LegacyUploadFile {
  return toLegacyUploadFile(normalizeUploadFile(file), file)
}

export function normalizeUploadFile(
  file: LegacyUploadFile | UploadFile,
  ownership: 'external' | 'temporary' = 'external',
): UploadFile {
  return {
    name: file.name,
    clientUploadContext: file.clientUploadContext,
    content: getFileContent(file, ownership),
    mimetype: file.mimetype,
    size: file.size,
  }
}

/** Preserve the public shape, including custom properties attached by user hooks. */
export function toLegacyUploadFile(
  file: UploadFile,
  original?: LegacyUploadFile,
): LegacyUploadFile {
  const { content } = file
  const legacy: LegacyUploadFile = {
    ...original,
    name: file.name,
    data:
      content.type === 'buffer'
        ? content.buffer
        : content.type === 'clientUpload'
          ? (content.probe ?? Buffer.alloc(0))
          : Buffer.alloc(0),
    mimetype: file.mimetype,
    size: file.size,
  }
  if (content.type === 'file') {
    legacy.tempFilePath = content.path
  } else {
    delete legacy.tempFilePath
  }
  if (file.clientUploadContext !== undefined) {
    legacy.clientUploadContext = file.clientUploadContext
  } else {
    delete legacy.clientUploadContext
  }
  return bindLegacyFileContent(legacy, content)
}
