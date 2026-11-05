import type { SanitizedUploadConfig } from './types.js'

import { describe, expect, it } from 'vitest'

import { getFileContentRequirement } from './getFileContentRequirement.js'

const localStorageConfig = { staticDir: '/tmp/media' } as SanitizedUploadConfig

const file = (filename: string, mimeType: string, config?: Partial<SanitizedUploadConfig>) => ({
  filename,
  mimeType,
  uploadConfig: { disableLocalStorage: true, ...localStorageConfig, ...config },
})
const video = (config?: Partial<SanitizedUploadConfig>) => file('clip.mp4', 'video/mp4', config)
const png = (config?: Partial<SanitizedUploadConfig>) => file('image.png', 'image/png', config)

describe('getFileContentRequirement', () => {
  it.each([
    ['the full file when local storage is enabled', video({ disableLocalStorage: false }), 'full'],
    ['nothing for a non-image file with no mime type allow list', video(), 'none'],
    [
      'the full file when a mime type allow list is configured',
      video({ mimeTypes: ['video/*'] }),
      'full',
    ],
    [
      'the full file when a mime type allow list overrides restricted type checks',
      video({ allowRestrictedFileTypes: true, mimeTypes: ['video/*'] }),
      'full',
    ],
    ['only the header for an image with no configured adjustments', png(), 'header'],
    [
      'the full file for an image a transformer will adjust',
      png({ hasImageAdjustments: true }),
      'full',
    ],
    [
      'the full file for an image with variants configured, even with no other adjustments',
      png({ variants: [{ name: 'thumbnail', width: 100 }] }),
      'full',
    ],
    ['only the header for an image with an empty variants array', png({ variants: [] }), 'header'],
    ['the full file for an animated image', file('image.gif', 'image/gif'), 'full'],
    [
      'the full file when the request includes a crop edit',
      { ...png(), hasSizeEdits: true },
      'full',
    ],
    [
      'only the header when the request has no size edits',
      { ...png(), hasSizeEdits: false },
      'header',
    ],
    [
      'only the header for a non-resizable but recognized image',
      file('image.jxl', 'image/jxl'),
      'header',
    ],
    // An SVG needs the whole document for its safety check.
    ['the full file for an SVG MIME type', file('logo.svg', 'image/svg+xml'), 'full'],
    [
      'the full file for an SVG MIME type with parameters',
      file('logo', 'image/svg+xml; charset=utf-8'),
      'full',
    ],
    [
      'the full file for an .svg filename with another MIME type',
      file('logo.svg', 'text/plain'),
      'full',
    ],
    [
      'the full file for an image when disableLocalStorage is not set',
      { ...png(), uploadConfig: localStorageConfig },
      'full',
    ],
    [
      'the full file for a non-image when disableLocalStorage is not set',
      { ...video(), uploadConfig: localStorageConfig },
      'full',
    ],
  ])('requires %s', (_name, args, expected) => {
    expect(getFileContentRequirement(args)).toBe(expected)
  })
})
