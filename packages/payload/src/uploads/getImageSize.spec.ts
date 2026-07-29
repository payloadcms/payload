import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import os from 'os'
import path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest'

import type { PayloadRequest } from '../types/index.js'

import { getImageSize } from './getImageSize.js'

// Tracks bytes actually read off disk so the streaming test below can assert
// that a large file's tail is never pulled into memory
const counters = vi.hoisted(() => ({ bytesReadFromDisk: 0 }))

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>()
  return {
    ...actual,
    createReadStream: (...args: Parameters<typeof actual.createReadStream>) => {
      const stream = actual.createReadStream(...args)
      stream.on('data', (chunk: Buffer) => {
        counters.bytesReadFromDisk += chunk.length
      })
      return stream
    },
  }
})

const dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesDir = path.resolve(dirname, '../../../../test/uploads')

// Minimal JPEG XL bare-codestream encoder (bit-packed, little-endian, LSB
// first). See probeImageSize.spec.ts for the full JXL parsing test suite;
// this only needs to produce a valid header for the sharp-fallback tests below
const encodeJXLCodestream = (width: number, height: number): Buffer => {
  const bits: number[] = []
  const pushBits = (value: number, length: number) => {
    for (let i = 0; i < length; i++) {
      bits.push((value >> i) & 1)
    }
  }
  const pushDimension = (value: number) => {
    const n = value - 1
    const sizeClasses = [9, 13, 18, 30]
    const classIndex = sizeClasses.findIndex((extraBits) => n < 2 ** extraBits)
    pushBits(classIndex, 2)
    pushBits(n, sizeClasses[classIndex]!)
  }

  pushBits(0, 1) // isSmallImage = false
  pushDimension(height)
  pushBits(0, 3) // widthMode = 0 (explicit dimension)
  pushDimension(width)

  const body = Buffer.alloc(Math.ceil(bits.length / 8))
  bits.forEach((bit, i) => {
    if (bit) {
      body[Math.floor(i / 8)]! |= 1 << i % 8
    }
  })

  return Buffer.concat([Buffer.from([0xff, 0x0a]), body])
}

const fileFor = (name: string): PayloadRequest['file'] => {
  const data = readFileSync(path.join(fixturesDir, name))
  // In-memory uploads carry an empty `tempFilePath`, which must fall back to `data`
  return {
    data,
    mimetype: 'image/test',
    name,
    size: data.length,
    tempFilePath: '',
  } as PayloadRequest['file']
}

describe('getImageSize', () => {
  const cases: Array<{ file: string; height: number; width: number }> = [
    { file: 'test-image.png', height: 800, width: 800 },
    { file: 'test-image.jpg', height: 800, width: 800 },
    { file: 'non-animated.webp', height: 420, width: 900 },
    { file: 'test-image-avif.avif', height: 800, width: 800 },
    { file: 'image.svg', height: 260, width: 260 },
  ]

  it.each(cases)('should read $file dimensions via sharp', async ({ file, height, width }) => {
    expect(await getImageSize({ file: fileFor(file), sharp })).toEqual({ height, width })
  })

  it.each(cases)(
    'should read $file dimensions via the probe fallback',
    async ({ file, height, width }) => {
      expect(await getImageSize({ file: fileFor(file) })).toEqual({ height, width })
    },
  )

  it('should fall back to the probe when sharp cannot decode a header-only image', async () => {
    // A 1x1 PNG truncated after IHDR: the header is readable but there is no
    // pixel data, so sharp throws while the probe still measures it.
    const data = Buffer.from(
      '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489',
      'hex',
    )
    const file = {
      data,
      mimetype: 'image/png',
      name: 'truncated.png',
      size: data.length,
      tempFilePath: '',
    } as PayloadRequest['file']

    expect(await getImageSize({ file, sharp })).toEqual({ height: 1, width: 1 })
    expect(await getImageSize({ file })).toEqual({ height: 1, width: 1 })
  })

  it('should read TIFF dimensions from a tempFilePath without a temp-file workaround', async () => {
    const tempFilePath = path.join(fixturesDir, 'test-image.tiff')
    const file = {
      mimetype: 'image/tiff',
      name: 'test-image.tiff',
      tempFilePath,
    } as PayloadRequest['file']

    expect(await getImageSize({ file, sharp })).toEqual({ height: 100, width: 200 })
    expect(await getImageSize({ file })).toEqual({ height: 100, width: 200 })
  })

  describe('sharp cannot decode JPEG XL', () => {
    const tempDir = mkdtempSync(path.join(os.tmpdir(), 'payload-get-image-size-jxl-'))

    afterAll(() => {
      rmSync(tempDir, { recursive: true, force: true })
    })

    it('should fall back to the probe for an in-memory JPEG XL buffer', async () => {
      // `isImage('image/jxl')` is true, so `generateFileData` always calls
      // `getImageSize` with `sharp` for JXL uploads; sharp rejects the format
      // (libvips has no JXL codec) and the probe must take over
      const data = encodeJXLCodestream(1920, 1080)
      const file = {
        data,
        mimetype: 'image/jxl',
        name: 'test.jxl',
        size: data.length,
        tempFilePath: '',
      } as PayloadRequest['file']

      expect(await getImageSize({ file, sharp })).toEqual({ height: 1080, width: 1920 })
    })

    it('should fall back to the probe for a JPEG XL tempFilePath', async () => {
      const tempFilePath = path.join(tempDir, 'test.jxl')
      writeFileSync(tempFilePath, encodeJXLCodestream(640, 480))

      const file = {
        mimetype: 'image/jxl',
        name: 'test.jxl',
        tempFilePath,
      } as PayloadRequest['file']

      expect(await getImageSize({ file, sharp })).toEqual({ height: 480, width: 640 })
    })
  })

  describe('streaming from tempFilePath', () => {
    const tempDir = mkdtempSync(path.join(os.tmpdir(), 'payload-get-image-size-'))

    afterEach(() => {
      counters.bytesReadFromDisk = 0
    })

    afterAll(() => {
      rmSync(tempDir, { recursive: true, force: true })
    })

    it('should not read a whole large PNG into memory when probing via tempFilePath', async () => {
      // image-dimensions only reads the PNG signature (bytes 0-7) and the
      // width/height fields (bytes 16-23); everything else here is filler
      const header = Buffer.alloc(24)
      header.write('\x89PNG\r\n\x1a\n', 0, 'binary')
      header.writeUInt32BE(1920, 16)
      header.writeUInt32BE(1080, 20)
      const largeFileSize = 3 * 1024 * 1024
      const largeFile = Buffer.concat([header, Buffer.alloc(largeFileSize)])

      const tempFilePath = path.join(tempDir, 'large.png')
      writeFileSync(tempFilePath, largeFile)

      const file = {
        mimetype: 'image/png',
        name: 'large.png',
        tempFilePath,
      } as PayloadRequest['file']

      expect(await getImageSize({ file })).toEqual({ height: 1080, width: 1920 })
      // Confirms the read actually went through `createReadStream` rather
      // than skipping it entirely (which would trivially satisfy "< 500KB")
      expect(counters.bytesReadFromDisk).toBeGreaterThan(0)
      expect(counters.bytesReadFromDisk).toBeLessThan(500 * 1024)
      expect(counters.bytesReadFromDisk).toBeLessThan(largeFile.length)
    })
  })
})
