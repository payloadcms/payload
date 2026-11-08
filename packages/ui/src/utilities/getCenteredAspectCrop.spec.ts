import { describe, expect, it } from 'vitest'

import { getCenteredAspectCrop } from './getCenteredAspectCrop.js'

describe('getCenteredAspectCrop', () => {
  it('should cover the full image when the ratio matches the image', () => {
    const crop = getCenteredAspectCrop({ aspectRatio: 16 / 9, imageHeight: 900, imageWidth: 1600 })

    expect(crop).toEqual({ height: 100, unit: '%', width: 100, x: 0, y: 0 })
  })

  it('should use the full width and center vertically when the ratio is wider than the image', () => {
    const crop = getCenteredAspectCrop({ aspectRatio: 2, imageHeight: 1000, imageWidth: 1000 })

    expect(crop).toEqual({ height: 50, unit: '%', width: 100, x: 0, y: 25 })
  })

  it('should use the full height and center horizontally when the ratio is narrower than the image', () => {
    const crop = getCenteredAspectCrop({ aspectRatio: 1, imageHeight: 1000, imageWidth: 2000 })

    expect(crop).toEqual({ height: 100, unit: '%', width: 50, x: 25, y: 0 })
  })

  it('should produce a pixel crop matching the requested ratio', () => {
    const imageWidth = 1200
    const imageHeight = 800
    const crop = getCenteredAspectCrop({ aspectRatio: 4 / 3, imageHeight, imageWidth })

    const pixelWidth = (crop.width / 100) * imageWidth
    const pixelHeight = (crop.height / 100) * imageHeight

    expect(pixelWidth / pixelHeight).toBeCloseTo(4 / 3)
    expect(pixelHeight).toBeCloseTo(imageHeight)
  })

  it('should keep the crop within the image bounds for a portrait ratio', () => {
    const crop = getCenteredAspectCrop({ aspectRatio: 9 / 16, imageHeight: 1080, imageWidth: 1920 })

    expect(crop.x + crop.width).toBeCloseTo(100 - crop.x)
    expect(crop.height).toBe(100)
    expect(crop.width).toBeLessThanOrEqual(100)
  })
})
