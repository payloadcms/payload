import { describe, expect, it } from 'vitest'

import type { UploadTransformer } from '../transformers/types.js'

import { getTransformKeyCoverageErrors } from './getTransformKeyCoverageErrors.js'

const crop = { height: 1, width: 1, x: 0, y: 0 }

describe('getTransformKeyCoverageErrors', () => {
  it.for([
    {
      name: 'no errors when each claimed key has one claimer and the rest are focalPoint or custom',
      claims: { sharp: ['crop', 'posterFrame'] },
      transforms: { crop, focalPoint: { x: 1, y: 1 }, watermark: 'draft' },
      expected: [],
    },
    {
      name: 'an error for a built-in key that no stage claims',
      claims: { sharp: ['crop'] },
      transforms: { rotate: { angle: 90 } },
      expected: [
        { message: 'No configured transformer applies this key.', path: '_transforms.rotate' },
      ],
    },
    {
      name: 'an error naming both stages for any key that two stages claim',
      claims: { other: ['logo'], sharp: ['logo'] },
      transforms: { logo: 'draft' },
      expected: [{ message: expect.stringMatching(/"other".*"sharp"/), path: '_transforms.logo' }],
    },
  ])('should return $name', ({ claims, expected, transforms }) => {
    const claimsByStage = new Map(
      Object.entries(claims).map(([slug, keys]): [UploadTransformer, string[]] => [
        { mimeTypes: ['*/*'], slug },
        keys,
      ]),
    )

    expect(getTransformKeyCoverageErrors({ claims: claimsByStage, transforms })).toEqual(expected)
  })
})
