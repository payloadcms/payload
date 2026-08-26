import type { CollectionSlug, Payload } from 'payload'

import { getFileByPath } from 'payload'
import { describe, expect, it } from 'vitest'

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
  getPayload,
  mainDimensions,
  sizes,
}: {
  collection: CollectionSlug
  getPayload: () => Payload
  mainDimensions: { height: number; width: number }
  sizes: SizeExpectation[]
}): void {
  describe('animated multi-frame resize reports per-frame dimensions', () => {
    it('should report the main file and every configured size at their single-frame dimensions', async () => {
      const payload = getPayload()
      const file = await getFileByPath(animatedWebpFixturePath)

      const createArgs = { collection, data: {}, file } as unknown as Parameters<
        Payload['create']
      >[0]
      const result = (await payload.create(createArgs)) as unknown as AnimatedUploadResult

      expect(result.height).toBe(mainDimensions.height)
      expect(result.width).toBe(mainDimensions.width)

      for (const size of sizes) {
        expect(result.sizes?.[size.name]?.height).toBe(size.height)
        expect(result.sizes?.[size.name]?.width).toBe(size.width)
      }

      await payload.delete({ id: result.id, collection })
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
  getPayload,
  size,
}: {
  collection: CollectionSlug
  focalPoint: { x: number; y: number }
  getPayload: () => Payload
  size: SizeExpectation
}): void {
  describe('animated multi-frame focal-point resize', () => {
    it('should resize to the exact target dimensions without throwing', async () => {
      const payload = getPayload()
      const file = await getFileByPath(animatedWebpFixturePath)

      const createArgs = {
        collection,
        data: { focalX: focalPoint.x, focalY: focalPoint.y },
        file,
      } as unknown as Parameters<Payload['create']>[0]
      const result = (await payload.create(createArgs)) as unknown as AnimatedUploadResult

      expect(result.sizes?.[size.name]?.height).toBe(size.height)
      expect(result.sizes?.[size.name]?.width).toBe(size.width)

      await payload.delete({ id: result.id, collection })
    })
  })
}
