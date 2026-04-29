import { describe, it, expect } from 'vitest'
import { buildComponentIndex } from './buildComponentIndex.js'
import type { SanitizedConfig } from './types.js'

describe('buildComponentIndex', () => {
  it('returns an empty index for a config with no components', () => {
    const config = makeConfig({
      collections: [{ slug: 'posts', fields: [{ name: 'title', type: 'text' }] }],
    })
    const index = buildComponentIndex(config)
    expect(index.componentsAt('posts.title')).toEqual([])
  })

  it('indexes a custom Field component on a field', () => {
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
    const index = buildComponentIndex(config)
    expect(index.componentsAt('posts.title')).toEqual([
      { componentPath: '@/MyField', kind: 'server', path: 'posts.title', slot: 'Field' },
    ])
  })

  it('tags entries with the kind returned by the classifier closure', () => {
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
            {
              name: 'body',
              type: 'text',
              admin: { components: { Field: { path: '@/ServerField' } } },
            },
          ],
        },
      ],
    })
    const index = buildComponentIndex(config, (componentPath) =>
      componentPath === '@/MyField' ? 'client' : 'server',
    )
    const titleEntries = index.componentsAt('posts.title')
    const bodyEntries = index.componentsAt('posts.body')
    expect(titleEntries[0]?.kind).toBe('client')
    expect(bodyEntries[0]?.kind).toBe('server')
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
    const index = buildComponentIndex(config)
    expect(index.componentsAt('orders.lineItems.*.sku')).toEqual([
      {
        componentPath: '@/SkuField',
        kind: 'server',
        path: 'orders.lineItems.*.sku',
        slot: 'Field',
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
    const index = buildComponentIndex(config)
    const results = index.componentsAt('orders.lineItems.5')
    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      slot: 'Field',
      componentPath: '@/SkuField',
    })
    expect(results[0].path).toBe('orders.lineItems.5.sku')
  })

  it('returns an empty array for an empty subtreePath', () => {
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
    const index = buildComponentIndex(config)
    expect(index.componentsAt('')).toEqual([])
  })
})

function makeConfig(partial: Partial<SanitizedConfig>): SanitizedConfig {
  return { collections: [], globals: [], ...partial } as unknown as SanitizedConfig
}
