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
})
