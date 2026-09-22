import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { describe, expect, it } from 'vitest'

import { probeImageSize } from './probeImageSize.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesDir = path.resolve(dirname, '../../../../test/uploads')

const readFixture = (name: string) => readFileSync(path.join(fixturesDir, name))

// Packs `{ length, value }` fields into a little-endian, LSB-first bitstream,
// matching the JPEG XL `SizeHeader` bit layout.
const packJXLBits = (fields: Array<{ length: number; value: number }>): Buffer => {
  const bits: number[] = []
  for (const { length, value } of fields) {
    for (let i = 0; i < length; i++) {
      bits.push((value >> i) & 1)
    }
  }

  const bytes = Buffer.alloc(Math.ceil(bits.length / 8))
  bits.forEach((bit, i) => {
    if (bit) {
      bytes[Math.floor(i / 8)]! |= 1 << i % 8
    }
  })

  return bytes
}

// Encodes a non-small `SizeHeader` dimension: a 2-bit size class selecting
// how many extra bits follow, then `value - 1` in that many bits.
const packJXLDimension = (value: number): Array<{ length: number; value: number }> => {
  const n = value - 1
  const sizeClasses = [9, 13, 18, 30]
  const classIndex = sizeClasses.findIndex((extraBits) => n < 2 ** extraBits)

  return [
    { length: 2, value: classIndex },
    { length: sizeClasses[classIndex]!, value: n },
  ]
}

const encodeJXLCodestream = (width: number, height: number): Buffer => {
  const body = packJXLBits([
    { length: 1, value: 0 }, // isSmallImage = false
    ...packJXLDimension(height),
    { length: 3, value: 0 }, // widthMode = 0 (explicit dimension)
    ...packJXLDimension(width),
  ])

  return Buffer.concat([Buffer.from([0xff, 0x0a]), body])
}

const encodeSmallJXLCodestream = (width: number, height: number): Buffer => {
  const body = packJXLBits([
    { length: 1, value: 1 }, // isSmallImage = true
    { length: 5, value: height / 8 - 1 },
    { length: 3, value: 0 }, // widthMode = 0 (explicit dimension)
    { length: 5, value: width / 8 - 1 },
  ])

  return Buffer.concat([Buffer.from([0xff, 0x0a]), body])
}

const jxlBox = (type: string, payload: Buffer): Buffer => {
  const box = Buffer.alloc(8 + payload.length)
  box.writeUInt32BE(box.length, 0)
  box.write(type, 4, 'ascii')
  payload.copy(box, 8)
  return box
}

// The fixed 12-byte JXL container signature box
const jxlSignatureBox = Buffer.from([
  0x00, 0x00, 0x00, 0x0c, 0x4a, 0x58, 0x4c, 0x20, 0x0d, 0x0a, 0x87, 0x0a,
])
const jxlFtypBox = jxlBox(
  'ftyp',
  Buffer.concat([Buffer.from('jxl '), Buffer.alloc(4), Buffer.from('jxl ')]),
)

describe('probeImageSize', () => {
  // Expected dimensions verified against the previous `image-size` implementation
  const cases: Array<{ file: string; height: number; width: number }> = [
    { file: 'test-image.png', height: 800, width: 800 },
    { file: 'small.png', height: 80, width: 320 },
    { file: 'image with spaces.png', height: 1600, width: 1600 },
    { file: 'test-image.jpg', height: 800, width: 800 },
    { file: 'test-image.tiff', height: 100, width: 200 },
    { file: 'image.svg', height: 260, width: 260 },
    { file: 'svgWithXml.svg', height: 1, width: 1 },
    { file: 'corrupt.svg', height: 400, width: 400 },
    { file: 'animated.webp', height: 200, width: 200 },
    { file: 'non-animated.webp', height: 420, width: 900 },
    { file: 'test-image-avif.avif', height: 800, width: 800 },
  ]

  it.each(cases)('should read dimensions for $file', ({ file, height, width }) => {
    expect(probeImageSize(readFixture(file))).toEqual({ height, width })
  })

  it('should return the largest image for a HEIF file embedding a thumbnail', () => {
    // Apple HEIC files place a small thumbnail `ispe` before the full-resolution
    // primary `ispe` inside `ipco`; the primary (largest) must win.
    const box = (type: string, payload: Buffer) => {
      const b = Buffer.alloc(8 + payload.length)
      b.writeUInt32BE(b.length, 0)
      b.write(type, 4, 'ascii')
      payload.copy(b, 8)
      return b
    }
    const ispe = (width: number, height: number) => {
      const payload = Buffer.alloc(12) // 4 bytes version/flags + width + height
      payload.writeUInt32BE(width, 4)
      payload.writeUInt32BE(height, 8)
      return box('ispe', payload)
    }
    const ipco = box('ipco', Buffer.concat([ispe(80, 80), ispe(400, 300)]))
    const iprp = box('iprp', ipco)
    const meta = box('meta', Buffer.concat([Buffer.alloc(4), iprp]))
    const ftyp = box('ftyp', Buffer.from('avif    '))
    const heif = Buffer.concat([ftyp, meta])

    expect(probeImageSize(heif)).toEqual({ height: 300, width: 400 })
  })

  it('should throw on an unsupported file type', () => {
    expect(() => probeImageSize(Buffer.from('not an image'))).toThrow()
  })

  it('should read dimensions for a BMP file', () => {
    const bmp = Buffer.alloc(54)
    bmp.write('BM', 0, 'ascii')
    bmp.writeUInt32LE(54, 10) // pixel data offset
    bmp.writeUInt32LE(40, 14) // BITMAPINFOHEADER size
    bmp.writeInt32LE(64, 18) // width
    bmp.writeInt32LE(-48, 22) // height stored negative for a top-down bitmap

    expect(probeImageSize(bmp)).toEqual({ height: 48, width: 64 })
  })

  it('should read dimensions for an ICO file, picking the largest embedded image', () => {
    const ico = Buffer.alloc(24)
    ico.writeUInt16LE(1, 2) // type: 1 = icon
    ico.writeUInt16LE(2, 4) // image count
    ico[6] = 16 // entry 0: 16x16
    ico[7] = 16
    ico[22] = 32 // entry 1: 32x32
    ico[23] = 32

    expect(probeImageSize(ico)).toEqual({ height: 32, width: 32 })
  })

  it('should read dimensions for a CUR file', () => {
    const cur = Buffer.alloc(22)
    cur.writeUInt16LE(2, 2) // type: 2 = cursor
    cur.writeUInt16LE(1, 4) // image count
    cur[6] = 24
    cur[7] = 24

    expect(probeImageSize(cur)).toEqual({ height: 24, width: 24 })
  })

  it('should not hang on a malformed HEIF buffer with a zero-size box', () => {
    // Reproduces the CVE-2025-71319 trigger: an ISO-BMFF box whose size field is
    // zero inside a container would loop forever in the unpatched `image-size`.
    const makeBox = (type: string, payload: Buffer) => {
      const box = Buffer.alloc(8 + payload.length)
      box.writeUInt32BE(box.length, 0)
      box.write(type, 4, 'ascii')
      payload.copy(box, 8)
      return box
    }
    const zeroSizeBox = Buffer.alloc(8)
    zeroSizeBox.write('ipco', 4, 'ascii') // size field left as 0
    const meta = makeBox('meta', Buffer.concat([Buffer.alloc(4), zeroSizeBox]))
    const ftyp = makeBox('ftyp', Buffer.from('avif    '))
    const malformed = Buffer.concat([ftyp, meta])

    expect(() => probeImageSize(malformed)).toThrow()
  })

  it('should read dimensions for a bare JPEG XL codestream', () => {
    expect(probeImageSize(encodeJXLCodestream(1920, 1080))).toEqual({ height: 1080, width: 1920 })
  })

  it('should read dimensions for a small bare JPEG XL codestream', () => {
    expect(probeImageSize(encodeSmallJXLCodestream(64, 48))).toEqual({ height: 48, width: 64 })
  })

  it('should read dimensions for a JPEG XL container with a single jxlc box', () => {
    const jxlc = jxlBox('jxlc', encodeJXLCodestream(640, 480))
    const container = Buffer.concat([jxlSignatureBox, jxlFtypBox, jxlc])

    expect(probeImageSize(container)).toEqual({ height: 480, width: 640 })
  })

  it('should reassemble a JPEG XL codestream split across jxlp boxes', () => {
    const codestream = encodeJXLCodestream(800, 600)
    const splitPoint = 3
    // Each jxlp payload is prefixed with a 4-byte partial-codestream index
    const jxlp0 = jxlBox(
      'jxlp',
      Buffer.concat([Buffer.from([0, 0, 0, 0]), codestream.subarray(0, splitPoint)]),
    )
    const jxlp1 = jxlBox(
      'jxlp',
      Buffer.concat([Buffer.from([0, 0, 0, 1]), codestream.subarray(splitPoint)]),
    )
    const container = Buffer.concat([jxlSignatureBox, jxlFtypBox, jxlp0, jxlp1])

    expect(probeImageSize(container)).toEqual({ height: 600, width: 800 })
  })

  it('should throw rather than hang on a JPEG XL container with a truncated jxlc box', () => {
    const truncatedJxlc = Buffer.alloc(8)
    truncatedJxlc.write('jxlc', 4, 'ascii') // size field left as 0: extends to end of buffer, no payload left
    const container = Buffer.concat([jxlSignatureBox, jxlFtypBox, truncatedJxlc])

    expect(() => probeImageSize(container)).toThrow()
  })

  it('should not hang on a JPEG XL container with thousands of unrelated boxes', () => {
    const unrelatedBoxes = Buffer.concat(
      Array.from({ length: 5000 }, () => jxlBox('free', Buffer.alloc(0))),
    )
    const container = Buffer.concat([jxlSignatureBox, jxlFtypBox, unrelatedBoxes])

    expect(() => probeImageSize(container)).toThrow()
  })
})
