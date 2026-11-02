import { randomUUID } from 'crypto'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { afterEach, describe, expect, it } from 'vitest'

import {
  isISOBaseMediaMimeType,
  validateISOBaseMediaBuffer,
  validateISOBaseMediaFile,
} from './validateISOBaseMediaFile.js'

const tempFiles: string[] = []

const box = (type: string, content = Buffer.alloc(0), size = content.length + 8): Buffer => {
  const header = Buffer.alloc(8)
  header.writeUInt32BE(size)
  header.write(type, 4, 4, 'latin1')
  return Buffer.concat([header, content])
}

const extendedBox = (type: string, content: Buffer): Buffer => {
  const header = Buffer.alloc(16)
  header.writeUInt32BE(1)
  header.write(type, 4, 4, 'latin1')
  header.writeBigUInt64BE(BigInt(content.length + 16), 8)
  return Buffer.concat([header, content])
}

const fileTypeContent = (brand = 'avif'): Buffer => {
  const content = Buffer.alloc(12)
  content.write(brand, 0, 4, 'latin1')
  content.write(brand, 8, 4, 'latin1')
  return content
}

const validFile = (brand = 'avif'): Buffer =>
  Buffer.concat([box('ftyp', fileTypeContent(brand)), box('free')])

afterEach(async () => {
  await Promise.all(tempFiles.splice(0).map((filePath) => fs.unlink(filePath)))
})

describe('ISO base media file validation', () => {
  it.each([
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
  ])('identifies %s as an ISO base media type', (mimeType) => {
    expect(isISOBaseMediaMimeType(mimeType)).toBe(true)
  })

  it('preserves unrelated media types', () => {
    expect(isISOBaseMediaMimeType('image/png')).toBe(false)
  })

  it('accepts normal and extended file type boxes', async () => {
    await expect(validateISOBaseMediaBuffer(validFile())).resolves.toBe(true)
    await expect(
      validateISOBaseMediaBuffer(
        Buffer.concat([extendedBox('ftyp', fileTypeContent('heic')), box('free')]),
      ),
    ).resolves.toBe(true)
  })

  it('accepts a final box that extends to the end of the file', async () => {
    const finalBox = box('mdat', Buffer.from('reference'), 0)
    await expect(
      validateISOBaseMediaBuffer(Buffer.concat([box('ftyp', fileTypeContent()), finalBox])),
    ).resolves.toBe(true)
  })

  it.each(['free', 'mdat', 'moov', 'wide'])(
    'accepts a QuickTime file beginning with %s',
    async (type) => {
      const content = Buffer.concat([box(type), box('mdat', Buffer.from('reference'))])
      await expect(validateISOBaseMediaBuffer(content)).resolves.toBe(true)
    },
  )

  it.each([
    ['missing following box', box('ftyp', fileTypeContent())],
    ['file type box extending to end', box('ftyp', fileTypeContent(), 0)],
    ['short file type payload', box('ftyp', Buffer.from('avif'), 12)],
    ['unaligned compatible brands', box('ftyp', Buffer.alloc(9), 17)],
    ['box extending beyond the file', box('ftyp', fileTypeContent(), 128)],
    ['trailing partial header', Buffer.concat([validFile(), Buffer.alloc(4)])],
  ])('rejects %s', async (_, content) => {
    await expect(validateISOBaseMediaBuffer(content)).resolves.toBe(false)
  })

  it('validates file-backed uploads without loading the full file', async () => {
    const filePath = path.join(os.tmpdir(), `payload-media-${randomUUID()}`)
    tempFiles.push(filePath)
    await fs.writeFile(filePath, validFile('mif1'))

    await expect(validateISOBaseMediaFile(filePath)).resolves.toBe(true)
  })
})
