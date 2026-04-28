import { describe, it, expect } from 'vitest'
import { buildComponentIndex } from './buildComponentIndex.js'
import type { SanitizedConfig } from './types.js'

// Stub classifier for tests: caller specifies kind via the import path's suffix.
const stubClassify = (p: string): 'server' | 'client' =>
  p.endsWith('.client') || p.includes('/client/') ? 'client' : 'server'

describe('buildComponentIndex', () => {
  it('returns an empty index for a config with no components', () => {
    const config = makeConfig({
      collections: [{ slug: 'posts', fields: [{ name: 'title', type: 'text' }] }],
    })
    const index = buildComponentIndex(config, stubClassify)
    expect(index.componentsAt('posts.title')).toEqual([])
  })

  it('indexes a custom Field component on a field with kind', () => {
    const config = makeConfig({
      collections: [
        {
          slug: 'posts',
          fields: [
            {
              name: 'title',
              type: 'text',
              admin: { components: { Field: { path: '@/MyField' } } },
            },
          ],
        },
      ],
    })
    const index = buildComponentIndex(config, stubClassify)
    expect(index.componentsAt('posts.title')).toEqual([
      { path: 'posts.title', slot: 'Field', componentPath: '@/MyField', kind: 'server' },
    ])
  })

  it("classifies a `'use client'` component as kind: 'client'", () => {
    const config = makeConfig({
      collections: [
        {
          slug: 'posts',
          fields: [
            {
              name: 'title',
              type: 'text',
              admin: { components: { Field: { path: '@/MyField.client' } } },
            },
          ],
        },
      ],
    })
    const index = buildComponentIndex(config, stubClassify)
    expect(index.componentsAt('posts.title')[0]).toMatchObject({ kind: 'client' })
  })

  it('indexes components inside arrays at wildcard paths', () => {
    const config = makeConfig({
      collections: [
        {
          slug: 'orders',
          fields: [
            {
              name: 'lineItems',
              type: 'array',
              fields: [
                {
                  name: 'sku',
                  type: 'text',
                  admin: { components: { Field: { path: '@/SkuField' } } },
                },
              ],
            },
          ],
        },
      ],
    })
    const index = buildComponentIndex(config, stubClassify)
    expect(index.componentsAt('orders.lineItems.*.sku')).toEqual([
      {
        path: 'orders.lineItems.*.sku',
        slot: 'Field',
        componentPath: '@/SkuField',
        kind: 'server',
      },
    ])
  })

  it('returns components rooted under a subtree path (concrete index from a structural add)', () => {
    const config = makeConfig({
      collections: [
        {
          slug: 'orders',
          fields: [
            {
              name: 'lineItems',
              type: 'array',
              fields: [
                {
                  name: 'sku',
                  type: 'text',
                  admin: { components: { Field: { path: '@/SkuField' } } },
                },
              ],
            },
          ],
        },
      ],
    })
    const index = buildComponentIndex(config, stubClassify)
    const results = index.componentsAt('orders.lineItems.5')
    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      slot: 'Field',
      componentPath: '@/SkuField',
      kind: 'server',
    })
    expect(results[0].path).toBe('orders.lineItems.5.sku')
  })
})

function makeConfig(partial: Partial<SanitizedConfig>): SanitizedConfig {
  return { collections: [], globals: [], ...partial } as unknown as SanitizedConfig
}
