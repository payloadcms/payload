import { imageDimensionsFromData } from 'image-dimensions'

import type { ProbedImageSize } from './types.js'

/**
 * Image dimension probe used as a fallback when `sharp` is not configured.
 * Reads only the header bytes needed to determine width and height.
 *
 * PNG, JPEG, GIF, WebP, AVIF and HEIF/HEIC are delegated to `image-dimensions`
 * (actively maintained, zero dependencies). BMP, ICO/CUR, SVG and TIFF have no
 * such maintained equivalent, so they're read here directly; each of those
 * parsers advances by a fixed amount or is bounded by an explicit guard, so
 * malformed input can never block the event loop.
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

type Dimensions = null | ProbedImageSize

type LegacyImageType = 'bmp' | 'ico' | 'svg' | 'tiff'

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
