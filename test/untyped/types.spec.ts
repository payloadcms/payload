import type {
  DataFromCollectionSlug,
  Job,
  JobTaskStatus,
  JsonObject,
  Payload,
  TypedCollection,
  TypeWithID,
} from 'payload'

import { describe, expect, test } from 'tstyche'

declare const payload: Payload

describe('Untyped Payload types', () => {
  test('should allow draft options without generated collection types', () => {
    expect(payload.find).type.toBeCallableWith({ collection: 'custom-collection', draft: true })
    expect(payload.findByID).type.toBeCallableWith({
      id: 'id',
      collection: 'custom-collection',
      draft: true,
    })
    expect(payload.create).type.toBeCallableWith({
      collection: 'custom-collection',
      data: { title: 'Example' },
      draft: true,
    })
    expect(payload.create).type.toBeCallableWith({
      collection: 'custom-collection',
      data: { title: 'Example' },
    })
  })

  test('should allow draft options without generated global types', () => {
    expect(payload.findGlobal).type.toBeCallableWith({ slug: 'custom-global', draft: true })
    expect(payload.updateGlobal).type.toBeCallableWith({
      slug: 'custom-global',
      data: {},
      draft: true,
    })
  })

  test('should expose managed and generic collection fallbacks', () => {
    expect<TypedCollection['payload-jobs']['createdAt']>().type.toBe<string>()
    expect<TypedCollection['payload-jobs']['taskStatus']>().type.toBe<JobTaskStatus>()
    expect<TypedCollection['custom-collection']['id']>().type.toBe<number | string>()
    expect<DataFromCollectionSlug<'custom-collection'>>().type.toBe<
      TypedCollection['custom-collection']
    >()
  })

  test('should use the payload-jobs collection fallback for Job', () => {
    expect<Job['id']>().type.toBe<number | string>()
    expect<Job['input']>().type.toBe<object>()
    expect<Job['processingToken']>().type.toBe<null | string | undefined>()
    expect<Job['processingUntil']>().type.toBe<null | string | undefined>()
    expect<Job['taskStatus']>().type.toBe<JobTaskStatus>()
  })

  test('should narrow Job input from an explicit input type', () => {
    expect<Job<{ message: string }>['input']>().type.toBe<{ message: string }>()
  })

  test('should preserve untyped collection operations', () => {
    expect(
      payload.create({
        collection: 'custom-collection',
        data: {
          title: 'Example',
        },
        overrideAccess: true,
      }),
    ).type.toBe<Promise<JsonObject & TypeWithID>>()
  })
})
