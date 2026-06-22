import type { ProbedImageSize } from './types.js'

/**
 * Dependency-free image dimension probe used as a fallback when `sharp` is not
 * configured. Reads only the header bytes needed to determine width and height.
 *
 * Replaces the archived `image-size` package, whose ICNS/HEIF parsers shipped
 * unpatched denial-of-service vulnerabilities (CVE-2025-71330, CVE-2025-71319).
 * Every parser here advances by a fixed amount or is bounded by an explicit
 * guard, so malformed input can never block the event loop.
 *
 * Supported formats: PNG, JPEG, GIF, BMP, WebP, TIFF, SVG, AVIF/HEIF, ICO/CUR.
 *
 * @throws if the buffer is not a recognized/parseable image format
 */
export function probeImageSize(data: Buffer): ProbedImageSize {
  const type = detectType(data)
  const dimensions = type ? parsers[type](data) : null

  if (!dimensions || !dimensions.width || !dimensions.height) {
    throw new Error('Unsupported image type: unable to determine dimensions')
  }

  return dimensions
}

type Dimensions = null | ProbedImageSize

type ImageType = 'bmp' | 'gif' | 'heif' | 'ico' | 'jpg' | 'png' | 'svg' | 'tiff' | 'webp'

// Cap on iterations for any variable-length scan, guarding against malformed
// input that would otherwise loop without advancing the offset.
const MAX_ITERATIONS = 100_000

function detectType(data: Buffer): ImageType | null {
  if (data.length < 2) {
    return null
  }

  if (
    data.length >= 8 &&
    data[0] === 0x89 &&
    data[1] === 0x50 &&
    data[2] === 0x4e &&
    data[3] === 0x47
  ) {
    return 'png'
  }
  if (data[0] === 0xff && data[1] === 0xd8) {
    return 'jpg'
  }
  if (data.length >= 6 && data.toString('ascii', 0, 3) === 'GIF') {
    return 'gif'
  }
  if (data[0] === 0x42 && data[1] === 0x4d) {
    return 'bmp'
  }
  if (
    data.length >= 16 &&
    data.toString('ascii', 0, 4) === 'RIFF' &&
    data.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp'
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
  // ISO base media file format (AVIF, HEIC, HEIF): bytes 4-8 spell 'ftyp'
  if (data.length >= 12 && data.toString('ascii', 4, 8) === 'ftyp') {
    return 'heif'
  }

  const head = data.toString('utf8', 0, Math.min(data.length, 1000))
  if (/<svg[\s>]/i.test(head) || (head.trimStart().startsWith('<?xml') && /<svg/i.test(head))) {
    return 'svg'
  }

  return null
}

const parsers: Record<ImageType, (data: Buffer) => Dimensions> = {
  bmp: (data) => ({ height: Math.abs(data.readInt32LE(22)), width: data.readInt32LE(18) }),
  gif: (data) => ({ height: data.readUInt16LE(8), width: data.readUInt16LE(6) }),
  heif: (data) => readHEIF(data),
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
  jpg: (data) => {
    let offset = 2

    for (let i = 0; offset + 9 < data.length && i < MAX_ITERATIONS; i++) {
      if (data[offset] !== 0xff) {
        offset++
        continue
      }

      const marker = data[offset + 1]!

      // Start Of Frame markers carry the dimensions (excluding the DHT/JPG/DAC markers)
      if (
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc
      ) {
        return { height: data.readUInt16BE(offset + 5), width: data.readUInt16BE(offset + 7) }
      }

      // Markers without a payload length
      if (
        marker === 0xd8 ||
        marker === 0xd9 ||
        marker === 0x01 ||
        (marker >= 0xd0 && marker <= 0xd7)
      ) {
        offset += 2
        continue
      }

      const segmentLength = data.readUInt16BE(offset + 2)
      if (segmentLength < 2) {
        break
      }
      offset += 2 + segmentLength
    }

    return null
  },
  png: (data) => ({ height: data.readUInt32BE(20), width: data.readUInt32BE(16) }),
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
  webp: (data) => {
    const format = data.toString('ascii', 12, 16)

    if (format === 'VP8 ') {
      return { height: data.readUInt16LE(28) & 0x3fff, width: data.readUInt16LE(26) & 0x3fff }
    }
    if (format === 'VP8L') {
      const bits = data.readUInt32LE(21)
      return { height: ((bits >> 14) & 0x3fff) + 1, width: (bits & 0x3fff) + 1 }
    }
    if (format === 'VP8X') {
      const width = 1 + (data[24]! | (data[25]! << 8) | (data[26]! << 16))
      const height = 1 + (data[27]! | (data[28]! << 8) | (data[29]! << 16))
      return { height, width }
    }

    return null
  },
}

type Box = { offset: number; size: number }

/**
 * Linear scan for the first ISO-BMFF box named `name` starting at `start`.
 * Advances by the box size, or by the header length when the size field is zero
 * (the CVE-2025-71319 trigger), so a malformed box can never stall the loop.
 */
function findBox(data: Buffer, name: string, start: number): Box | null {
  let offset = start

  for (let i = 0; offset + 8 <= data.length && i < MAX_ITERATIONS; i++) {
    const size = data.readUInt32BE(offset)
    // A box claiming more bytes than remain is malformed; stop scanning
    if (size > data.length - offset) {
      break
    }
    if (data.toString('ascii', offset + 4, offset + 8) === name) {
      return { offset, size }
    }
    offset += size > 8 ? size : 8
  }

  return null
}

/**
 * Resolves AVIF/HEIF dimensions by navigating `meta → iprp → ipco` and reading
 * the `ispe` (image spatial extent) boxes within it. A file may embed several
 * images (e.g. a thumbnail alongside the full-resolution primary image), each
 * with its own `ispe`; the largest is the primary image, matching what the
 * previous `image-size` implementation reported.
 */
function readHEIF(data: Buffer): Dimensions {
  // `meta` is a full box: 8-byte header + 4 bytes version/flags before children
  const meta = findBox(data, 'meta', 0)
  const iprp = meta && findBox(data, 'iprp', meta.offset + 12)
  const ipco = iprp && findBox(data, 'ipco', iprp.offset + 8)
  if (!ipco) {
    return null
  }

  const ipcoEnd = ipco.offset + ipco.size
  let best: Dimensions = null
  let offset = ipco.offset + 8

  for (let i = 0; offset < ipcoEnd && i < MAX_ITERATIONS; i++) {
    const ispe = findBox(data, 'ispe', offset)
    if (!ispe || ispe.offset >= ipcoEnd) {
      break
    }
    // 8-byte header + 4 bytes version/flags precede the 32-bit width and height
    const width = data.readUInt32BE(ispe.offset + 12)
    const height = data.readUInt32BE(ispe.offset + 16)
    if (!best || width * height > best.width * best.height) {
      best = { height, width }
    }
    offset = ispe.offset + ispe.size
  }

  return best
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
