import { describe, expect, it } from 'vitest'

import {
  buildDynamicTransformation,
  buildImageSizeTransformation,
  buildMainTransformationChain,
  resolveCropMode,
  toCloudinaryOptions,
} from './buildTransformation.js'

const dynamicDefaults = {
  crop: 'fill',
  format: undefined,
  gravity: 'center',
  maxHeight: 4096,
  maxPixels: 16_777_216,
  maxWidth: 4096,
  quality: 'auto',
  withoutEnlargement: false,
} as const

describe('resolveCropMode', () => {
  it.each([
    [{ hasHeight: true, hasWidth: true, withoutEnlargement: false }, 'fill'],
    [{ hasHeight: false, hasWidth: true, withoutEnlargement: false }, 'scale'],
    [{ hasHeight: true, hasWidth: true, withoutEnlargement: true }, 'lfill'],
    [{ hasHeight: true, hasWidth: false, withoutEnlargement: true }, 'limit'],
  ])('should map %o to the matching Cloudinary crop mode', (args, expected) => {
    expect(resolveCropMode({ fillMode: 'fill', ...args })).toBe(expected)
  })
})

describe('buildDynamicTransformation', () => {
  it('should fill the exact box when both dimensions are given', () => {
    expect(
      buildDynamicTransformation({ defaults: dynamicDefaults, height: 300, width: 400 }),
    ).toStrictEqual({
      crop: 'fill',
      fetchFormat: undefined,
      gravity: 'center',
      height: 300,
      quality: 'auto',
      width: 400,
    })
  })

  it('should preserve the aspect ratio with a single dimension', () => {
    expect(buildDynamicTransformation({ defaults: dynamicDefaults, width: 400 })).toMatchObject({
      crop: 'scale',
      width: 400,
    })
  })

  it('should let the request override the configured withoutEnlargement default', () => {
    expect(
      buildDynamicTransformation({
        defaults: { ...dynamicDefaults, withoutEnlargement: true },
        width: 400,
        withoutEnlargement: false,
      }),
    ).toMatchObject({ crop: 'scale' })
  })
})

describe('buildImageSizeTransformation', () => {
  const originalDimensions = { height: 1000, width: 2000 }

  it('should build a fill transformation for a two-dimension size', () => {
    expect(
      buildImageSizeTransformation({
        originalDimensions,
        size: { height: 300, width: 400 },
      }),
    ).toMatchObject({ crop: 'fill', height: 300, width: 400 })
  })

  it('should anchor an explicit focal point in source pixels', () => {
    expect(
      buildImageSizeTransformation({
        focalPoint: { x: 25, y: 75 },
        originalDimensions,
        size: { height: 300, width: 400 },
      }),
    ).toMatchObject({ gravity: 'center', x: 500, y: 750 })
  })

  it('should let an explicit gravity win over the focal point', () => {
    const transformation = buildImageSizeTransformation({
      focalPoint: { x: 25, y: 75 },
      originalDimensions,
      size: { gravity: 'auto', height: 300, width: 400 },
    })

    expect(transformation.gravity).toBe('auto')
    expect(transformation.x).toBeUndefined()
  })
})

describe('buildMainTransformationChain', () => {
  it('should be empty with nothing configured', () => {
    expect(buildMainTransformationChain({})).toStrictEqual([])
  })

  it('should put the crop rectangle in its own chained step', () => {
    expect(
      buildMainTransformationChain({
        crop: {
          heightInPixels: 200,
          originalDimensions: { height: 1000, width: 2000 },
          widthInPixels: 400,
          x: 100,
          y: 50,
        },
        resizeOptions: { width: 800 },
      }),
    ).toStrictEqual([
      { crop: 'crop', height: 200, width: 400, x: 100, y: 50 },
      { crop: 'scale', width: 800 },
    ])
  })

  it('should append a format-only step', () => {
    expect(
      buildMainTransformationChain({ formatOptions: { format: 'webp', quality: 'auto' } }),
    ).toStrictEqual([{ fetchFormat: 'webp', quality: 'auto' }])
  })
})

describe('toCloudinaryOptions', () => {
  it('should drop unset keys', () => {
    expect(toCloudinaryOptions({ crop: 'scale', width: 400 })).toStrictEqual({
      crop: 'scale',
      width: 400,
    })
  })

  it('should omit gravity for a crop mode that ignores it', () => {
    expect(toCloudinaryOptions({ crop: 'scale', gravity: 'center', width: 400 })).toStrictEqual({
      crop: 'scale',
      width: 400,
    })
  })

  it('should switch gravity to xy_center when a focal point is present', () => {
    expect(toCloudinaryOptions({ crop: 'fill', gravity: 'center', x: 10, y: 20 })).toMatchObject({
      gravity: 'xy_center',
      x: 10,
      y: 20,
    })
  })
})
