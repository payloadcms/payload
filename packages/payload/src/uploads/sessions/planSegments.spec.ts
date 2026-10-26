import { describe, expect, it } from 'vitest'

import type { SegmentedUploadLimits } from './types.js'

import { planSegments, shouldUseSegmentedUpload } from './planSegments.js'

const MiB = 1024 * 1024
const GiB = 1024 * MiB

const s3Limits: SegmentedUploadLimits = {
  maximumConcurrency: 8,
  maximumObjectSize: 5 * 1024 * GiB,
  maximumSegmentCount: 10_000,
  maximumSegmentSize: 5 * GiB,
  minimumSegmentSize: 5 * MiB,
  segmentSizeGranularity: 1,
}

describe('planSegments', () => {
  it('should use the core default segment size and concurrency', () => {
    const plan = planSegments({ limits: s3Limits, size: 100 * MiB })

    expect(plan.segmentSize).toBe(16 * MiB)
    expect(plan.segments).toHaveLength(7)
    expect(plan.concurrency).toBe(4)
  })

  it('should cover every byte exactly once with a short final segment', () => {
    const size = 100 * MiB + 3
    const { segments } = planSegments({ limits: s3Limits, size })

    expect(segments[0]).toEqual({ end: 16 * MiB, number: 1, start: 0 })
    expect(segments.at(-1)!.end).toBe(size)

    for (let i = 1; i < segments.length; i++) {
      expect(segments[i]!.start).toBe(segments[i - 1]!.end)
    }
  })

  it('should grow segments so the file fits within the maximum segment count', () => {
    const size = 500 * GiB
    const plan = planSegments({ limits: s3Limits, size })

    expect(plan.segments.length).toBeLessThanOrEqual(10_000)
    expect(plan.segmentSize).toBe(Math.ceil(size / 10_000))
  })

  it('should never go below the provider minimum segment size', () => {
    const plan = planSegments({
      collectionTransfer: { preferredSegmentSize: MiB },
      limits: s3Limits,
      size: 100 * MiB,
    })

    expect(plan.segmentSize).toBe(5 * MiB)
  })

  it('should round segment size up to the provider granularity', () => {
    const plan = planSegments({
      collectionTransfer: { preferredSegmentSize: 10 * MiB + 1 },
      limits: { ...s3Limits, segmentSizeGranularity: 256 * 1024 },
      size: 100 * MiB,
    })

    expect(plan.segmentSize % (256 * 1024)).toBe(0)
    expect(plan.segmentSize).toBe(10 * MiB + 256 * 1024)
  })

  it('should reject files larger than the provider maximum object size', () => {
    expect(() =>
      planSegments({ limits: { ...s3Limits, maximumObjectSize: GiB }, size: GiB + 1 }),
    ).toThrow('larger than the storage provider allows')
  })

  it('should reject files that cannot be split within the maximum segment size', () => {
    expect(() =>
      planSegments({
        limits: { ...s3Limits, maximumSegmentCount: 2, maximumSegmentSize: 10 * MiB },
        size: 30 * MiB,
      }),
    ).toThrow('segment limits')
  })

  it('should force a concurrency of one for ordered protocols', () => {
    const plan = planSegments({ limits: { ...s3Limits, isOrdered: true }, size: 100 * MiB })

    expect(plan.concurrency).toBe(1)
  })

  it('should prefer collection over global over adapter preferences', () => {
    const limits = { ...s3Limits, recommendedSegmentSize: 8 * MiB }

    expect(planSegments({ limits, size: 100 * MiB }).segmentSize).toBe(8 * MiB)
    expect(
      planSegments({ globalTransfer: { preferredSegmentSize: 32 * MiB }, limits, size: 100 * MiB })
        .segmentSize,
    ).toBe(32 * MiB)
    expect(
      planSegments({
        collectionTransfer: { preferredSegmentSize: 24 * MiB },
        globalTransfer: { preferredSegmentSize: 32 * MiB },
        limits,
        size: 100 * MiB,
      }).segmentSize,
    ).toBe(24 * MiB)
  })

  it('should cap preferred concurrency at the provider maximum', () => {
    const plan = planSegments({
      globalTransfer: { concurrency: 32 },
      limits: s3Limits,
      size: 100 * MiB,
    })

    expect(plan.concurrency).toBe(8)
  })
})

describe('shouldUseSegmentedUpload', () => {
  it('should switch to segmented transfer at the 64 MiB threshold', () => {
    expect(shouldUseSegmentedUpload({ size: 64 * MiB - 1 })).toBe(false)
    expect(shouldUseSegmentedUpload({ size: 64 * MiB })).toBe(true)
    expect(shouldUseSegmentedUpload({ size: 64 * MiB + 1 })).toBe(true)
  })
})
