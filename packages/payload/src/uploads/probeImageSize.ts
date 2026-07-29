import { createReadStream } from 'fs'
import fs from 'fs/promises'
import { imageDimensionsFromData, imageDimensionsFromStream } from 'image-dimensions'

import type { ProbedImageSize } from './types.js'

/**
 * Image dimension probe used as a fallback when `sharp` is not configured.
 * Reads only the header bytes needed to determine width and height.
 *
 * PNG, JPEG, GIF, WebP, AVIF and HEIF/HEIC are delegated to `image-dimensions`
 * (actively maintained, zero dependencies). BMP, ICO/CUR, SVG, TIFF and JPEG
 * XL have no such maintained equivalent, so they're read here directly; each
 * of those parsers advances by a fixed amount or is bounded by an explicit
 * guard, so malformed input can never block the event loop.
 *
 * Replaces the archived `image-size` package, whose ICNS/HEIF parsers shipped
 * unpatched denial-of-service vulnerabilities (CVE-2025-71330, CVE-2025-71319).
 *
 * @throws if the buffer is not a recognized/parseable image format
 */
export function probeImageSize(data: Buffer): ProbedImageSize {
  const modernDimensions = imageDimensionsFromData(data)
  const dimensions = modernDimensions
    ? { height: modernDimensions.height, width: modernDimensions.width }
    : probeLegacyFormat(data)

  if (!dimensions || !dimensions.width || !dimensions.height) {
    throw new Error('Unsupported image type: unable to determine dimensions')
  }

  return dimensions
}

/**
 * Bytes read from the start of the file to detect a legacy/JXL format from
 * its header; comfortably covers every signature `detectLegacyType` checks.
 */
const HEADER_SNIFF_LENGTH = 4096

/**
 * Probe used when the file lives on disk via `tempFilePath`. PNG, JPEG, GIF,
 * WebP, AVIF and HEIF/HEIC are read through `imageDimensionsFromStream`,
 * which reads only as many bytes as are needed to find the header, so a
 * large file's data is never pulled into memory. BMP, ICO/CUR, SVG, TIFF and
 * JPEG XL are detected from a small header sniff and, only then, read in
 * full for `probeImageSize` to parse.
 *
 * @throws if the file is not a recognized/parseable image format
 */
export async function probeImageSizeFromPath(tempFilePath: string): Promise<ProbedImageSize> {
  const headerSniff = await readHeaderSniff(tempFilePath)

  if (detectLegacyType(headerSniff)) {
    return probeImageSize(await fs.readFile(tempFilePath))
  }

  const modernDimensions = await imageDimensionsFromStream(
    ReadableStream.from(createReadStream(tempFilePath)),
  )

  if (modernDimensions) {
    return { height: modernDimensions.height, width: modernDimensions.width }
  }

  return probeImageSize(await fs.readFile(tempFilePath))
}

async function readHeaderSniff(tempFilePath: string): Promise<Buffer> {
  const handle = await fs.open(tempFilePath, 'r')

  try {
    const buffer = Buffer.alloc(HEADER_SNIFF_LENGTH)
    const { bytesRead } = await handle.read(buffer, 0, HEADER_SNIFF_LENGTH, 0)
    return buffer.subarray(0, bytesRead)
  } finally {
    await handle.close()
  }
}

type Dimensions = null | ProbedImageSize

type LegacyImageType = 'bmp' | 'ico' | 'jxl' | 'svg' | 'tiff'

function probeLegacyFormat(data: Buffer): Dimensions {
  const type = detectLegacyType(data)
  return type ? legacyParsers[type](data) : null
}

function detectLegacyType(data: Buffer): LegacyImageType | null {
  if (data.length < 2) {
    return null
  }

  if (data[0] === 0x42 && data[1] === 0x4d) {
    return 'bmp'
  }
  if (
    data.length >= 8 &&
    ((data[0] === 0x49 && data[1] === 0x49 && data[2] === 0x2a) ||
      (data[0] === 0x4d && data[1] === 0x4d && data[3] === 0x2a))
  ) {
    return 'tiff'
  }
  if (
    data.length >= 6 &&
    data[0] === 0 &&
    data[1] === 0 &&
    (data[2] === 1 || data[2] === 2) &&
    data[3] === 0
  ) {
    return 'ico'
  }
  if ((data[0] === 0xff && data[1] === 0x0a) || isJXLContainerSignature(data)) {
    return 'jxl'
  }

  const head = data.toString('utf8', 0, Math.min(data.length, 1000))
  if (/<svg[\s>]/i.test(head) || (head.trimStart().startsWith('<?xml') && /<svg/i.test(head))) {
    return 'svg'
  }

  return null
}

const legacyParsers: Record<LegacyImageType, (data: Buffer) => Dimensions> = {
  bmp: (data) => ({ height: Math.abs(data.readInt32LE(22)), width: data.readInt32LE(18) }),
  ico: (data) => {
    const count = data.readUInt16LE(4)
    let best: ProbedImageSize = { height: 0, width: 0 }

    for (let i = 0; i < count && i < 1000; i++) {
      const entry = 6 + i * 16
      if (entry + 2 > data.length) {
        break
      }
      // A zero byte means 256 px in the ICO format
      const width = data[entry] === 0 ? 256 : data[entry]!
      const height = data[entry + 1] === 0 ? 256 : data[entry + 1]!
      if (width * height > best.width * best.height) {
        best = { height, width }
      }
    }

    return best.width ? best : null
  },
  jxl: (data) => parseJXL(data),
  svg: (data) => parseSVG(data),
  tiff: (data) => {
    const isLittleEndian = data[0] === 0x49
    const readU16 = (offset: number) =>
      isLittleEndian ? data.readUInt16LE(offset) : data.readUInt16BE(offset)
    const readU32 = (offset: number) =>
      isLittleEndian ? data.readUInt32LE(offset) : data.readUInt32BE(offset)

    const ifdOffset = readU32(4)
    if (ifdOffset + 2 > data.length) {
      return null
    }

    const entryCount = readU16(ifdOffset)
    let width: number | undefined
    let height: number | undefined

    for (let i = 0; i < entryCount && i < 1000; i++) {
      const entry = ifdOffset + 2 + i * 12
      if (entry + 12 > data.length) {
        break
      }
      const tag = readU16(entry)
      const fieldType = readU16(entry + 2)
      // SHORT (type 3) values are 16-bit, otherwise read as 32-bit LONG
      const value = fieldType === 3 ? readU16(entry + 8) : readU32(entry + 8)
      if (tag === 256) {
        width = value
      } else if (tag === 257) {
        height = value
      }
    }

    return width && height ? { height, width } : null
  },
}

function parseSVG(data: Buffer): Dimensions {
  const text = data.toString('utf8', 0, Math.min(data.length, 65536))
  const tagMatch = text.match(/<svg[^>]*>/i)
  if (!tagMatch) {
    return null
  }

  const tag = tagMatch[0]
  const readLength = (name: string): null | number => {
    const match = tag.match(new RegExp(`${name}\\s*=\\s*["']?\\s*([^"'\\s>]+)`, 'i'))
    if (!match) {
      return null
    }
    // Percentage units are relative and yield no concrete pixel size
    if (/%\s*$/.test(match[1]!)) {
      return null
    }
    const value = parseFloat(match[1]!)
    return Number.isFinite(value) ? value : null
  }

  const width = readLength('width')
  const height = readLength('height')
  if (width != null && height != null) {
    return { height: Math.round(height), width: Math.round(width) }
  }

  const viewBoxMatch = tag.match(/viewbox\s*=\s*["']?\s*([\d.\s,+-]+)/i)
  if (viewBoxMatch) {
    const parts = viewBoxMatch[1]!
      .trim()
      .split(/[\s,]+/)
      .map(Number)
    if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
      const [, , viewWidth, viewHeight] = parts as [number, number, number, number]
      if (width != null) {
        return { height: Math.round((width / viewWidth) * viewHeight), width: Math.round(width) }
      }
      if (height != null) {
        return { height: Math.round(height), width: Math.round((height / viewHeight) * viewWidth) }
      }
      return { height: Math.round(viewHeight), width: Math.round(viewWidth) }
    }
  }

  return null
}

/**
 * JPEG XL isn't supported by `image-dimensions`, so its size header is read
 * directly. A JXL file is either a bare codestream starting `FF 0A`, or an
 * ISOBMFF container carrying the codestream in a single `jxlc` box or split
 * across several `jxlp` boxes; either way the dimensions live in the first
 * bits of the codestream (the `SizeHeader`). See https://www.w3.org/TR/jpeg-xl/
 * for the bitstream layout.
 */
function parseJXL(data: Buffer): Dimensions {
  if (data[0] === 0xff && data[1] === 0x0a) {
    return parseJXLSizeHeader(data, 2)
  }

  // A boxed codestream still starts with the `FF 0A` signature, so it's
  // skipped here too, same as the bare-codestream case above
  const jxlcBox = findBox(data, 'jxlc', 0)
  if (jxlcBox) {
    return parseJXLSizeHeader(data, jxlcBox.bodyOffset + 2)
  }

  const jxlpBoxes = findAllBoxes(data, 'jxlp')
  if (!jxlpBoxes.length) {
    return null
  }

  // Each `jxlp` payload is prefixed with a 4-byte partial-codestream index
  const codestream = Buffer.concat(
    jxlpBoxes.map((box) => data.subarray(box.bodyOffset + 4, box.offset + box.size)),
  )
  return parseJXLSizeHeader(codestream, 2)
}

function isJXLContainerSignature(data: Buffer): boolean {
  return (
    data.length >= 12 &&
    data.readUInt32BE(0) === 0x0000000c &&
    data.toString('ascii', 4, 8) === 'JXL ' &&
    data[8] === 0x0d &&
    data[9] === 0x0a &&
    data[10] === 0x87 &&
    data[11] === 0x0a
  )
}

type Box = { bodyOffset: number; name: string; offset: number; size: number }

function readBoxHeader(data: Buffer, offset: number): Box | null {
  if (offset + 8 > data.length) {
    return null
  }

  const name = data.toString('ascii', offset + 4, offset + 8)
  let size = data.readUInt32BE(offset)
  let bodyOffset = offset + 8

  if (size === 1) {
    // A size of 1 means a 64-bit size follows the 8-byte header
    if (offset + 16 > data.length) {
      return null
    }
    const largeSize = data.readBigUInt64BE(offset + 8)
    if (largeSize > BigInt(Number.MAX_SAFE_INTEGER)) {
      return null
    }
    size = Number(largeSize)
    bodyOffset = offset + 16
  } else if (size === 0) {
    // A size of 0 means the box extends to the end of the buffer
    size = data.length - offset
  }

  if (size < bodyOffset - offset || offset + size > data.length) {
    return null
  }

  return { name, bodyOffset, offset, size }
}

// Bounded to the same 1000-entry cap used elsewhere in this file so a
// malformed chain of boxes can never block the event loop
function findBox(data: Buffer, name: string, startOffset: number): Box | null {
  let offset = startOffset

  for (let i = 0; i < 1000 && offset < data.length; i++) {
    const box = readBoxHeader(data, offset)
    if (!box) {
      return null
    }
    if (box.name === name) {
      return box
    }
    offset += box.size
  }

  return null
}

function findAllBoxes(data: Buffer, name: string): Box[] {
  const boxes: Box[] = []
  let offset = 0

  for (let i = 0; i < 1000 && offset < data.length; i++) {
    const box = readBoxHeader(data, offset)
    if (!box) {
      break
    }
    if (box.name === name) {
      boxes.push(box)
    }
    offset += box.size
  }

  return boxes
}

/**
 * Reads the JXL `SizeHeader` bit-packed structure (little-endian, LSB
 * first) starting at `startOffset` in the codestream.
 */
function parseJXLSizeHeader(data: Buffer, startOffset: number): Dimensions {
  let byteOffset = startOffset
  let bitOffset = 0

  const readBits = (length: number): number => {
    let result = 0
    let bitsRead = 0

    while (bitsRead < length) {
      if (byteOffset >= data.length) {
        throw new RangeError('Unexpected end of JXL codestream')
      }
      const currentByte = data[byteOffset]!
      const bitsLeft = 8 - bitOffset
      const bitsToRead = Math.min(length - bitsRead, bitsLeft)
      const mask = (1 << bitsToRead) - 1
      result |= ((currentByte >> bitOffset) & mask) << bitsRead

      bitsRead += bitsToRead
      bitOffset += bitsToRead
      if (bitOffset === 8) {
        byteOffset++
        bitOffset = 0
      }
    }

    return result
  }

  const readExplicitDimension = (): number => {
    const sizeClass = readBits(2)
    const extraBits = [9, 13, 18, 30][sizeClass]!
    return 1 + readBits(extraBits)
  }

  try {
    const isSmallImage = readBits(1) === 1
    const height = isSmallImage ? 8 * (1 + readBits(5)) : readExplicitDimension()
    const widthMode = readBits(3)

    let width: number
    if (isSmallImage && widthMode === 0) {
      width = 8 * (1 + readBits(5))
    } else if (widthMode === 0) {
      width = readExplicitDimension()
    } else {
      const aspectRatios = [1, 1.2, 4 / 3, 1.5, 16 / 9, 5 / 4, 2]
      width = Math.floor(height * aspectRatios[widthMode - 1]!)
    }

    return { height, width }
  } catch {
    return null
  }
}
