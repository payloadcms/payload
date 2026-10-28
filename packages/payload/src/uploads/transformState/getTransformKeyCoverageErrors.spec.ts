import { describe, expect, it } from 'vitest'

import type { UploadTransformer } from '../transformers/types.js'

import { getTransformKeyCoverageErrors } from './getTransformKeyCoverageErrors.js'

const makeStage = (slug: string): UploadTransformer => ({ mimeTypes: ['*/*'], slug })

describe('getTransformKeyCoverageErrors', () => {
  it('should return no errors when there is nothing to run', () => {
    const errors = getTransformKeyCoverageErrors({ claims: new Map(), transforms: null })

    expect(errors).toEqual([])
  })

  it('should return no errors when every saved key has exactly one claim', () => {
    const sharp = makeStage('sharp')
    const clipper = makeStage('clipper')

    const errors = getTransformKeyCoverageErrors({
      claims: new Map([
        [sharp, ['crop', 'focalPoint']],
        [clipper, ['clip']],
      ]),
      transforms: {
        clip: { endMs: 10, startMs: 0 },
        crop: { height: 1, width: 1, x: 0, y: 0 },
        focalPoint: { x: 50, y: 50 },
      },
    })

    expect(errors).toEqual([])
  })

  it('should name a saved key that no stage claims', () => {
    const errors = getTransformKeyCoverageErrors({
      claims: new Map([[makeStage('sharp'), ['crop']]]),
      transforms: { watermark: { text: 'draft' } },
    })

    expect(errors).toEqual([
      {
        message: expect.stringContaining('No configured transformer'),
        path: '_transforms.watermark',
      },
    ])
  })

  it('should name a saved key and both transformers when two stages claim it', () => {
    const errors = getTransformKeyCoverageErrors({
      claims: new Map([
        [makeStage('sharp'), ['crop']],
        [makeStage('other-cropper'), ['crop']],
      ]),
      transforms: { crop: { height: 1, width: 1, x: 0, y: 0 } },
    })

    expect(errors).toEqual([
      {
        message: expect.stringMatching(/"sharp".*"other-cropper"/),
        path: '_transforms.crop',
      },
    ])
  })

  it('should return one error for each uncovered key', () => {
    const errors = getTransformKeyCoverageErrors({
      claims: new Map(),
      transforms: { clip: { endMs: 10, startMs: 0 }, watermark: true },
    })

    expect(errors.map(({ path }) => path)).toEqual(['_transforms.clip', '_transforms.watermark'])
  })

  it('should ignore a claimed key that is not saved', () => {
    const errors = getTransformKeyCoverageErrors({
      claims: new Map([[makeStage('clipper'), ['clip', 'posterFrame']]]),
      transforms: { clip: { endMs: 10, startMs: 0 } },
    })

    expect(errors).toEqual([])
  })

  it('should allow a focalPoint that no stage claims', () => {
    const errors = getTransformKeyCoverageErrors({
      claims: new Map(),
      transforms: { focalPoint: { x: 20, y: 80 } },
    })

    expect(errors).toEqual([])
  })

  it('should reject a focalPoint that two stages claim', () => {
    const errors = getTransformKeyCoverageErrors({
      claims: new Map([
        [makeStage('sharp'), ['focalPoint']],
        [makeStage('smart-crop'), ['focalPoint']],
      ]),
      transforms: { focalPoint: { x: 20, y: 80 } },
    })

    expect(errors.map(({ path }) => path)).toEqual(['_transforms.focalPoint'])
  })
})
