import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { describe, expect, it } from 'vitest'

import { probeImageSize } from './probeImageSize.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesDir = path.resolve(dirname, '../../../../test/uploads')

const readFixture = (name: string) => readFileSync(path.join(fixturesDir, name))

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
})
