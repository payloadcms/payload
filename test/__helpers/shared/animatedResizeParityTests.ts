import type { CollectionSlug, Payload } from 'payload'

import { getFileByPath } from 'payload'
import { expect } from 'vitest'

import { test } from '../int/vitest.js'
import { animatedWebpFixturePath } from './imageFixtures.js'

type SizeExpectation = {
  height: number
  name: string
  width: number
}

// `CollectionSlug` can't narrow to an upload shape, so this result type is
// deliberately loose rather than fought with unsafe casts.
type AnimatedUploadResult = {
  height: null | number
  id: number | string
  sizes: Record<string, { height?: null | number; width?: null | number }>
  width: null | number
}

/**
 * Regression coverage: resizing an animated multi-frame image must report
 * single-frame dimensions, not the full frame-stack dimensions. Reusable
 * across any transformer supporting the legacy image-sizes upload flow.
 */
export function runAnimatedResizeReportsPerFrameDimensionsTest({
  collection,
  mainDimensions,
  sizes,
}: {
  collection: CollectionSlug
  mainDimensions: { height: number; width: number }
  sizes: SizeExpectation[]
}): void {
  test.describe('animated multi-frame resize reports per-frame dimensions', () => {
    test('should report the main file and every configured size at their single-frame dimensions', async ({
      payload,
    }) => {
      const file = await getFileByPath(animatedWebpFixturePath)

      const createArgs = {
        collection,
        data: {},
        file,
        overrideAccess: true,
      } as unknown as Parameters<Payload['create']>[0]
      const result = (await payload.create(createArgs)) as unknown as AnimatedUploadResult

      expect(result.height).toBe(mainDimensions.height)
      expect(result.width).toBe(mainDimensions.width)

      for (const size of sizes) {
        expect(result.sizes?.[size.name]?.height).toBe(size.height)
        expect(result.sizes?.[size.name]?.width).toBe(size.width)
      }
    })
  })
}

/**
 * Regression coverage: a focal-point crop on an animated multi-frame image
 * must resize cleanly. A wrong per-frame divisor throws or corrupts output
 * rather than just mis-reporting a number, so success at the exact target
 * dimensions is a meaningful correctness proof.
 */
export function runAnimatedFocalPointResizeStaysValidTest({
  collection,
  focalPoint,
  size,
}: {
  collection: CollectionSlug
  focalPoint: { x: number; y: number }
  size: SizeExpectation
}): void {
  test.describe('animated multi-frame focal-point resize', () => {
    test('should resize to the exact target dimensions without throwing', async ({ payload }) => {
      const file = await getFileByPath(animatedWebpFixturePath)

      const createArgs = {
        collection,
        data: { focalX: focalPoint.x, focalY: focalPoint.y },
        file,
        overrideAccess: true,
      } as unknown as Parameters<Payload['create']>[0]
      const result = (await payload.create(createArgs)) as unknown as AnimatedUploadResult

      expect(result.sizes?.[size.name]?.height).toBe(size.height)
      expect(result.sizes?.[size.name]?.width).toBe(size.width)
    })
  })
}
