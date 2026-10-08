import type { SanitizedUploadConfig } from './types.js'

import { describe, expect, it } from 'vitest'

import { getFileContentRequirement } from './getFileContentRequirement.js'

describe('getFileContentRequirement', () => {
  it.each([
    { expected: 'full', mimeType: 'video/mp4', upload: { disableLocalStorage: false } },
    {
      expected: 'full',
      mimeType: 'video/mp4',
      upload: { disableLocalStorage: true, mimeTypes: ['video/*'] },
    },
    { expected: 'none', mimeType: 'video/mp4', upload: { disableLocalStorage: true } },
    { expected: 'header', mimeType: 'image/png', upload: { disableLocalStorage: true } },
    {
      expected: 'full',
      mimeType: 'image/png',
      upload: { disableLocalStorage: true, resizeOptions: { width: 100 } },
    },
    {
      expected: 'full',
      mimeType: 'image/png',
      upload: { disableLocalStorage: true, imageSizes: [{ name: 'thumb', width: 100 }] },
    },
    { expected: 'full', mimeType: 'image/gif', upload: { disableLocalStorage: true } },
  ])('returns $expected for $mimeType and $upload', ({ expected, mimeType, upload }) => {
    expect(
      getFileContentRequirement({
        mimeType,
        uploadConfig: upload as SanitizedUploadConfig,
      }),
    ).toBe(expected)
  })

  it('requires full content when the request includes crop or size edits', () => {
    expect(
      getFileContentRequirement({
        hasSizeEdits: true,
        mimeType: 'image/png',
        uploadConfig: { disableLocalStorage: true } as SanitizedUploadConfig,
      }),
    ).toBe('full')
  })

  it('returns none for a restricted-type-allowed non-image when mimeTypes validation is bypassed', () => {
    expect(
      getFileContentRequirement({
        mimeType: 'video/mp4',
        uploadConfig: {
          allowRestrictedFileTypes: true,
          disableLocalStorage: true,
          mimeTypes: ['video/*'],
        } as SanitizedUploadConfig,
      }),
    ).toBe('none')
  })
})
