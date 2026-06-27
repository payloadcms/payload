import { describe, expect, it } from 'vitest'

import type { SanitizedUploadConfig } from './types.js'

import { uploadRequiresFileData } from './uploadRequiresFileData.js'

const uploadConfig = (overrides: Partial<SanitizedUploadConfig> = {}): SanitizedUploadConfig =>
  overrides as SanitizedUploadConfig

const baseConfig = uploadConfig()

describe('uploadRequiresFileData', () => {
  it('should not require file data when sharp is not configured', () => {
    expect(
      uploadRequiresFileData({ hasSharp: false, mimeType: 'image/png', uploadConfig: baseConfig }),
    ).toBe(false)
  })

  it('should not require file data for a plain image with no resize config', () => {
    expect(
      uploadRequiresFileData({ hasSharp: true, mimeType: 'image/png', uploadConfig: baseConfig }),
    ).toBe(false)
  })

  it('should not require file data when only focalPoint is enabled (no imageSizes)', () => {
    expect(
      uploadRequiresFileData({
        hasSharp: true,
        mimeType: 'image/png',
        uploadConfig: uploadConfig({ focalPoint: true }),
      }),
    ).toBe(false)
  })

  it('should require file data when imageSizes are configured', () => {
    expect(
      uploadRequiresFileData({
        hasSharp: true,
        mimeType: 'image/png',
        uploadConfig: uploadConfig({ imageSizes: [{ name: 'thumb', width: 100 }] }),
      }),
    ).toBe(true)
  })

  it('should require file data when resizeOptions are configured', () => {
    expect(
      uploadRequiresFileData({
        hasSharp: true,
        mimeType: 'image/png',
        uploadConfig: uploadConfig({ resizeOptions: { width: 200 } }),
      }),
    ).toBe(true)
  })

  it('should require file data for animated image types', () => {
    expect(
      uploadRequiresFileData({ hasSharp: true, mimeType: 'image/gif', uploadConfig: baseConfig }),
    ).toBe(true)
  })

  it('should require file data when a crop edit is requested', () => {
    expect(
      uploadRequiresFileData({
        hasSharp: true,
        mimeType: 'image/png',
        uploadConfig: baseConfig,
        uploadEdits: { crop: { height: 10, unit: 'px', width: 10, x: 0, y: 0 } },
      }),
    ).toBe(true)
  })

  it('should not require file data for non-resizable mimetypes', () => {
    expect(
      uploadRequiresFileData({
        hasSharp: true,
        mimeType: 'application/pdf',
        uploadConfig: uploadConfig({ imageSizes: [{ name: 'thumb', width: 100 }] }),
      }),
    ).toBe(false)
  })
})
