import { readFileSync } from 'fs'
import path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { describe, expect, it } from 'vitest'

import type { PayloadRequest } from '../types/index.js'

import { getImageSize } from './getImageSize.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesDir = path.resolve(dirname, '../../../../test/uploads')

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
})
