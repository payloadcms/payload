import type { PayloadRequest } from '../../../types/index.js'

import { describe, expect, it } from 'vitest'

import { generateSlug } from './generateSlug.js'

describe('generateSlug', () => {
  it('should await a custom async slugify function', async () => {
    const data: Record<string, unknown> = {
      title: 'Async Slug',
    }
    const hook = generateSlug({
      slugFieldName: 'slug',
      slugify: async ({ valueToSlugify }) => String(valueToSlugify).toLowerCase().replace(' ', '-'),
      useAsSlug: 'title',
    })

    await hook({
      data,
      operation: 'create',
      req: {} as PayloadRequest,
    } as Parameters<typeof hook>[0])

    expect(data.slug).toBe('async-slug')
  })

  it('should synchronously assign default slugify during create to prevent required validation race (#18334)', () => {
    const data: Record<string, unknown> = {
      title: 'Hello Slug',
    }
    const hook = generateSlug({
      slugFieldName: 'slug',
      useAsSlug: 'title',
    })

    // Invoke without awaiting immediately to verify synchronous property assignment
    const hookPromise = hook({
      data,
      operation: 'create',
      req: {} as PayloadRequest,
    } as Parameters<typeof hook>[0])

    // Must be set synchronously on data before microtask resolution
    expect(data.slug).toBe('hello-slug')
  })
})
