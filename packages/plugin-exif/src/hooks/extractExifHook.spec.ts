import { rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'

import type { ExtractedExif } from '../types.js'

import { extractExifHook } from './extractExifHook.js'

const extracted: ExtractedExif = {
  latitude: 1,
  longitude: 2,
  raw: { Make: 'Canon' },
  takenAt: '2020-01-01T00:00:00.000Z',
}

describe('extractExifHook', () => {
  it('should skip when there is no uploaded file', async () => {
    const extract = vi.fn()
    const hook = extractExifHook({ extract, fieldName: 'exif' })
    const data = { title: 'x' }

    const result = await hook({ data, operation: 'create', req: {} } as never)

    expect(result).toBe(data)
    expect(extract).not.toHaveBeenCalled()
  })

  it('should populate the exif field from the file buffer', async () => {
    const extract = vi.fn().mockResolvedValue(extracted)
    const hook = extractExifHook({ extract, fieldName: 'exif' })
    const buffer = Buffer.from('imgbytes')

    const result = await hook({
      data: {},
      operation: 'create',
      req: { file: { data: buffer } },
    } as never)

    expect(extract).toHaveBeenCalledWith({ buffer })
    // location is GeoJSON [longitude, latitude]; make/model live only in raw.
    expect(result.exif).toMatchObject({
      location: [2, 1],
      raw: { Make: 'Canon' },
      takenAt: '2020-01-01T00:00:00.000Z',
    })
  })

  it('should read from tempFilePath when the data buffer is empty', async () => {
    const extract = vi.fn().mockResolvedValue(extracted)
    const hook = extractExifHook({ extract, fieldName: 'exif' })
    const tempFilePath = path.join(tmpdir(), 'plugin-exif-temp-fixture.bin')
    await writeFile(tempFilePath, Buffer.from('ondisk'))

    const result = await hook({
      data: {},
      operation: 'create',
      req: { file: { data: Buffer.alloc(0), tempFilePath } },
    } as never)
    await rm(tempFilePath, { force: true })

    expect(extract).toHaveBeenCalledWith({ buffer: Buffer.from('ondisk') })
    expect(result.exif).toBeDefined()
  })

  it('should not add the field when extraction returns null', async () => {
    const extract = vi.fn().mockResolvedValue(null)
    const hook = extractExifHook({ extract, fieldName: 'exif' })
    const data = {}

    const result = await hook({
      data,
      operation: 'create',
      req: { file: { data: Buffer.from('x') } },
    } as never)

    expect(result).toBe(data)
    expect(result.exif).toBeUndefined()
  })
})
