import { describe, expect, it } from 'vitest'

import type { UploadTransformer } from '../transformers/types.js'

import { getTransformKeyCoverageErrors } from './getTransformKeyCoverageErrors.js'

const makeStage = (slug: string): UploadTransformer => ({ mimeTypes: ['*/*'], slug })

const clip = { endMs: 10, startMs: 0 }
const crop = { height: 1, width: 1, x: 0, y: 0 }
const focalPoint = { x: 20, y: 80 }

describe('getTransformKeyCoverageErrors', () => {
  it.for([
    { name: 'no keys are saved', claims: [], transforms: null },
    {
      name: 'every saved key has exactly one claim',
      claims: [
        ['sharp', ['crop', 'focalPoint']],
        ['clipper', ['clip']],
      ],
      transforms: { clip, crop, focalPoint },
    },
    {
      name: 'a custom key has no claim',
      claims: [['sharp', ['crop']]],
      transforms: { watermark: { text: 'draft' } },
    },
    {
      name: 'a claimed key is not saved',
      claims: [['clipper', ['clip', 'posterFrame']]],
      transforms: { clip },
    },
    { name: 'a focalPoint has no claim', claims: [], transforms: { focalPoint } },
  ] as const)('should return no errors when $name', ({ claims, transforms }) => {
    const errors = getTransformKeyCoverageErrors({
      claims: new Map(claims.map(([slug, keys]) => [makeStage(slug), [...keys]])),
      transforms,
    })

    expect(errors).toEqual([])
  })

  it.for([
    {
      name: 'a custom key that two stages claim',
      claims: [
        ['watermarker', ['watermark']],
        ['other-watermarker', ['watermark']],
      ],
      transforms: { watermark: { text: 'draft' } },
      expectedPaths: ['_transforms.watermark'],
    },
    {
      name: 'a focalPoint that two stages claim',
      claims: [
        ['sharp', ['focalPoint']],
        ['smart-crop', ['focalPoint']],
      ],
      transforms: { focalPoint },
      expectedPaths: ['_transforms.focalPoint'],
    },
    {
      name: 'each saved built-in key that no stage claims',
      claims: [],
      transforms: { clip, rotate: { angle: 90 } },
      expectedPaths: ['_transforms.clip', '_transforms.rotate'],
    },
  ] as const)('should reject $name', ({ claims, expectedPaths, transforms }) => {
    const errors = getTransformKeyCoverageErrors({
      claims: new Map(claims.map(([slug, keys]) => [makeStage(slug), [...keys]])),
      transforms,
    })

    expect(errors.map(({ path }) => path)).toEqual(expectedPaths)
  })

  it('should explain that no configured transformer applies an unclaimed built-in key', () => {
    const errors = getTransformKeyCoverageErrors({
      claims: new Map([[makeStage('sharp'), ['crop']]]),
      transforms: { rotate: { angle: 90 } },
    })

    expect(errors).toEqual([
      {
        message: expect.stringContaining('No configured transformer'),
        path: '_transforms.rotate',
      },
    ])
  })

  it('should name both transformers when two stages claim a saved key', () => {
    const errors = getTransformKeyCoverageErrors({
      claims: new Map([
        [makeStage('sharp'), ['crop']],
        [makeStage('other-cropper'), ['crop']],
      ]),
      transforms: { crop },
    })

    expect(errors).toEqual([
      {
        message: expect.stringMatching(/"sharp".*"other-cropper"/),
        path: '_transforms.crop',
      },
    ])
  })
})
