import type { SanitizedUploadConfig } from './types.js'

import { describe, expect, it } from 'vitest'

import { getFileContentRequirement } from './getFileContentRequirement.js'

const createUploadConfig = (
  overrides: Partial<SanitizedUploadConfig> = {},
): SanitizedUploadConfig =>
  ({
    disableLocalStorage: true,
    staticDir: '/tmp/media',
    ...overrides,
  }) as SanitizedUploadConfig

describe('getFileContentRequirement', () => {
  it('requires the full file when local storage is enabled', () => {
    expect(
      getFileContentRequirement({
        mimeType: 'video/mp4',
        uploadConfig: createUploadConfig({ disableLocalStorage: false }),
      }),
    ).toBe('full')
  })

  it('requires nothing for a non-image file with no mime type allow list', () => {
    expect(
      getFileContentRequirement({
        mimeType: 'video/mp4',
        uploadConfig: createUploadConfig(),
      }),
    ).toBe('none')
  })

  it('requires the full file when a mime type allow list is configured', () => {
    expect(
      getFileContentRequirement({
        mimeType: 'video/mp4',
        uploadConfig: createUploadConfig({ mimeTypes: ['video/*'] }),
      }),
    ).toBe('full')
  })

  it('does not require content when allowRestrictedFileTypes bypasses the mime type check', () => {
    expect(
      getFileContentRequirement({
        mimeType: 'video/mp4',
        uploadConfig: createUploadConfig({
          allowRestrictedFileTypes: true,
          mimeTypes: ['video/*'],
        }),
      }),
    ).toBe('none')
  })

  it('requires only the header for an image with no configured adjustments', () => {
    expect(
      getFileContentRequirement({
        mimeType: 'image/png',
        uploadConfig: createUploadConfig(),
      }),
    ).toBe('header')
  })

  it('requires the full file for an image with resize options configured', () => {
    expect(
      getFileContentRequirement({
        mimeType: 'image/png',
        uploadConfig: createUploadConfig({ resizeOptions: { width: 100 } }),
      }),
    ).toBe('full')
  })

  it('requires the full file for an image with imageSizes configured, even with no other adjustments', () => {
    expect(
      getFileContentRequirement({
        mimeType: 'image/png',
        uploadConfig: createUploadConfig({ imageSizes: [{ name: 'thumbnail', width: 100 }] }),
      }),
    ).toBe('full')
  })

  it('requires only the header for an image with an empty imageSizes array', () => {
    expect(
      getFileContentRequirement({
        mimeType: 'image/png',
        uploadConfig: createUploadConfig({ imageSizes: [] }),
      }),
    ).toBe('header')
  })

  it('requires the full file for an animated image even with no configured adjustments', () => {
    expect(
      getFileContentRequirement({
        mimeType: 'image/gif',
        uploadConfig: createUploadConfig(),
      }),
    ).toBe('full')
  })

  it('requires the full file when the request includes a crop edit, even with no configured adjustments', () => {
    expect(
      getFileContentRequirement({
        hasSizeEdits: true,
        mimeType: 'image/png',
        uploadConfig: createUploadConfig(),
      }),
    ).toBe('full')
  })

  it('requires only the header when the request has no size edits and no configured adjustments', () => {
    expect(
      getFileContentRequirement({
        hasSizeEdits: false,
        mimeType: 'image/png',
        uploadConfig: createUploadConfig(),
      }),
    ).toBe('header')
  })

  it('requires only the header for a non-resizable but recognized image type', () => {
    expect(
      getFileContentRequirement({
        mimeType: 'image/svg+xml',
        uploadConfig: createUploadConfig(),
      }),
    ).toBe('header')
  })

  it('requires the full file for an image when disableLocalStorage is not set', () => {
    expect(
      getFileContentRequirement({
        mimeType: 'image/png',
        uploadConfig: { staticDir: '/tmp/media' } as SanitizedUploadConfig,
      }),
    ).toBe('full')
  })

  it('requires the full file for a non-image type when disableLocalStorage is not set', () => {
    expect(
      getFileContentRequirement({
        mimeType: 'video/mp4',
        uploadConfig: { staticDir: '/tmp/media' } as SanitizedUploadConfig,
      }),
    ).toBe('full')
  })
})
