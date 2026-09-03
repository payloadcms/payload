import type { FileData, PayloadRequest } from 'payload'

import { describe, expect, it } from 'vitest'

import { getIncomingFiles } from './getIncomingFiles.js'

const makeFile = () => ({
  name: 'photo.webp',
  data: Buffer.from('binary'),
  mimetype: 'image/webp',
  size: 5000,
})

const makeReq = (file: unknown): PayloadRequest =>
  ({
    file,
    payloadUploadSizes: {},
  }) as unknown as PayloadRequest

describe('getIncomingFiles', () => {
  it('should fall back to the uploaded file name/mimetype when `select` projects them out of data', () => {
    const req = makeReq(makeFile())

    // `?select[...]` on a create request can omit filename/mimeType from `data`
    const files = getIncomingFiles({ data: {} as Partial<FileData>, req })

    expect(files).toHaveLength(1)
    expect(files[0]).toMatchObject({
      filename: 'photo.webp',
      filesize: 5000,
      mimeType: 'image/webp',
    })
  })

  it('should prefer filename/mimeType from data when present', () => {
    const req = makeReq(makeFile())

    const files = getIncomingFiles({
      data: { filename: 'renamed.webp', mimeType: 'image/png' } as Partial<FileData>,
      req,
    })

    expect(files).toHaveLength(1)
    expect(files[0]).toMatchObject({
      filename: 'renamed.webp',
      mimeType: 'image/png',
    })
  })

  it('should return no files when there is no uploaded file', () => {
    const req = makeReq(undefined)

    const files = getIncomingFiles({
      data: { filename: 'photo.webp', mimeType: 'image/webp' } as Partial<FileData>,
      req,
    })

    expect(files).toHaveLength(0)
  })
})
