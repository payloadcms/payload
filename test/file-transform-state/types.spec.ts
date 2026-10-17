import type { CropTransform, FileSource, TransformState } from 'payload'

import { describe, expect, test } from 'tstyche'

import type { TransformStateMedia } from './payload-types.js'

describe('file transform state generated types', () => {
  test('should expose an open object with named built-in properties', () => {
    expect<{ crop: CropTransform; custom: { steps: number[] } }>().type.toBeAssignableTo<
      NonNullable<TransformStateMedia['_transforms']>
    >()
    expect<{ crop: string }>().type.not.toBeAssignableTo<
      NonNullable<TransformStateMedia['_transforms']>
    >()
    expect<null>().type.toBeAssignableTo<TransformStateMedia['_transforms']>()
  })

  test('should generate stronger optional custom-key types', () => {
    expect<{ undeclared: number; watermark: { text: string } }>().type.toBeAssignableTo<
      NonNullable<TransformStateMedia['_transforms']>
    >()
    expect<{ watermark: { text: number } }>().type.not.toBeAssignableTo<
      NonNullable<TransformStateMedia['_transforms']>
    >()
  })

  test('should support custom keys without a registration type', () => {
    expect<{
      vendor: { nested: [string, number, boolean, null] }
    }>().type.toBeAssignableTo<TransformState>()
  })

  test('should require an explicit byte bound for whole-file reads', () => {
    expect<Parameters<FileSource['arrayBuffer']>>().type.toBe<[{ maxBytes: number }]>()
    expect<Parameters<FileSource['read']>>().type.toBe<[{ length: number; offset?: number }]>()
  })
})
