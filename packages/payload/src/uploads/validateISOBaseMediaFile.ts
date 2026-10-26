import fs from 'fs/promises'

const MAX_BOX_COUNT = 10_000
const QUICKTIME_FIRST_BOX_TYPES = new Set(['free', 'mdat', 'moov', 'wide'])

const ISO_BASE_MEDIA_MIME_TYPES = new Set([
  'audio/mp4',
  'audio/x-m4a',
  'image/avif',
  'image/heic',
  'image/heic-sequence',
  'image/heif',
  'image/heif-sequence',
  'image/x-canon-cr3',
  'video/3gpp',
  'video/3gpp2',
  'video/mp4',
  'video/quicktime',
  'video/x-m4v',
])

type ReadAt = (position: number, length: number) => Promise<Buffer>

export const isISOBaseMediaMimeType = (mimeType: string): boolean =>
  ISO_BASE_MEDIA_MIME_TYPES.has(mimeType)

const validateBoxStructure = async (size: number, readAt: ReadAt): Promise<boolean> => {
  if (!Number.isSafeInteger(size) || size < 24) {
    return false
  }

  let boxCount = 0
  let position = 0

  while (position < size) {
    if (++boxCount > MAX_BOX_COUNT || size - position < 8) {
      return false
    }

    const header = await readAt(position, Math.min(16, size - position))
    if (header.length < 8) {
      return false
    }

    const boxType = header.toString('latin1', 4, 8)
    const size32 = header.readUInt32BE(0)
    let boxSize: number
    let headerSize = 8

    if (size32 === 0) {
      boxSize = size - position
    } else if (size32 === 1) {
      if (header.length < 16) {
        return false
      }

      const size64 = header.readBigUInt64BE(8)
      if (size64 > BigInt(Number.MAX_SAFE_INTEGER)) {
        return false
      }

      boxSize = Number(size64)
      headerSize = 16
    } else {
      boxSize = size32
    }

    if (boxSize < headerSize || boxSize > size - position) {
      return false
    }

    if (position === 0 && boxType === 'ftyp') {
      const payloadSize = boxSize - headerSize
      if (size32 === 0 || payloadSize < 8 || (payloadSize - 8) % 4 !== 0 || boxSize === size) {
        return false
      }
    } else if (position === 0 && !QUICKTIME_FIRST_BOX_TYPES.has(boxType)) {
      return false
    }

    position += boxSize
  }

  return position === size
}

export const validateISOBaseMediaBuffer = async (buffer: Buffer): Promise<boolean> =>
  validateBoxStructure(buffer.length, (position, length) =>
    Promise.resolve(buffer.subarray(position, position + length)),
  )

export const validateISOBaseMediaFile = async (filePath: string): Promise<boolean> => {
  let fileHandle: Awaited<ReturnType<typeof fs.open>> | undefined

  try {
    fileHandle = await fs.open(filePath, 'r')
    const { size } = await fileHandle.stat()

    return await validateBoxStructure(size, async (position, length) => {
      const buffer = Buffer.allocUnsafe(length)
      const { bytesRead } = await fileHandle!.read(buffer, 0, length, position)
      return buffer.subarray(0, bytesRead)
    })
  } catch {
    return false
  } finally {
    await fileHandle?.close()
  }
}
