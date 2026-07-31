import type { Crop } from 'payload'

import { describe, expect, it } from 'vitest'

import { getInitialCrop } from './getInitialCrop.js'

const persistedCrop = {
  height: 40,
  unit: '%',
  width: 50,
  x: 10,
  y: 15,
} satisfies Crop

const unsavedCrop = {
  height: 60,
  unit: '%',
  width: 70,
  x: 5,
  y: 10,
} satisfies Crop

describe('getInitialCrop', () => {
  it('should restore a persisted crop in preserve mode', () => {
    expect(
      getInitialCrop({
        cropMode: 'preserve',
        data: { cropRect: persistedCrop },
      }),
    ).toEqual(persistedCrop)
  })

  it('should not restore a persisted crop in transform mode', () => {
    expect(
      getInitialCrop({
        cropMode: 'transform',
        data: { cropRect: persistedCrop },
      }),
    ).toBeUndefined()
  })

  it('should prefer unsaved edits in transform mode', () => {
    expect(
      getInitialCrop({
        cropMode: 'transform',
        data: { cropRect: persistedCrop },
        uploadEdits: { crop: unsavedCrop },
      }),
    ).toEqual(unsavedCrop)
  })

  it('should prefer unsaved edits in preserve mode', () => {
    expect(
      getInitialCrop({
        cropMode: 'preserve',
        data: { cropRect: persistedCrop },
        uploadEdits: { crop: unsavedCrop },
      }),
    ).toEqual(unsavedCrop)
  })
})
