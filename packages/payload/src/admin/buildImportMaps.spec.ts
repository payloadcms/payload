import { describe, it, expect } from 'vitest'
import { buildImportMaps } from './buildImportMaps.js'

describe('buildImportMaps', () => {
  it('puts a server-only validator only in the server map', () => {
    const maps = buildImportMaps({
      collections: [{ slug: 'x', fields: [{ name: 'y', type: 'text', validate: () => true }] }],
      globals: [],
    } as any)
    expect(maps.server.entries.some((e) => e.kind === 'validate')).toBe(true)
    expect(maps.client.entries.some((e) => e.kind === 'validate')).toBe(false)
  })

  it('puts admin.condition and admin.validate only in the client map', () => {
    const maps = buildImportMaps({
      collections: [
        {
          slug: 'x',
          fields: [
            {
              name: 'y',
              type: 'text',
              admin: { condition: () => true, validate: '@/v/y' },
            },
          ],
        },
      ],
      globals: [],
    } as any)
    expect(maps.client.entries.some((e) => e.kind === 'admin-validate' && e.path === '@/v/y')).toBe(
      true,
    )
    expect(maps.client.entries.some((e) => e.kind === 'admin-condition')).toBe(true)
    expect(maps.client.entries.find((e) => e.kind === 'admin-condition')?.path).toBe('<inline>')
    expect(maps.server.entries.some((e) => e.kind === 'admin-validate')).toBe(false)
    expect(maps.server.entries.some((e) => e.kind === 'admin-condition')).toBe(false)
  })

  it('puts every component into BOTH server and client maps', () => {
    const maps = buildImportMaps({
      collections: [
        {
          slug: 'x',
          fields: [
            {
              name: 'y',
              type: 'text',
              admin: { components: { Field: { path: '@/MyField' } } },
            },
          ],
        },
      ],
      globals: [],
    } as any)
    expect(maps.server.entries.some((e) => e.path === '@/MyField')).toBe(true)
    expect(maps.client.entries.some((e) => e.path === '@/MyField')).toBe(true)
  })

  it('includes a component nested inside an array in both maps with a wildcard path', () => {
    const maps = buildImportMaps({
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
      globals: [],
    } as any)
    const matchInServer = maps.server.entries.find((e) => e.path === '@/SkuField')
    const matchInClient = maps.client.entries.find((e) => e.path === '@/SkuField')
    expect(matchInServer).toBeDefined()
    expect(matchInClient).toBeDefined()
    expect(matchInServer?.fieldPath).toBe('orders.lineItems.*.sku')
    expect(matchInClient?.fieldPath).toBe('orders.lineItems.*.sku')
  })

  it('produces empty client and server entries for a config with no admin.components', () => {
    const maps = buildImportMaps({
      collections: [
        {
          slug: 'plain',
          fields: [{ name: 'title', type: 'text' }],
        },
      ],
      globals: [],
    } as any)
    expect(maps.server.entries.filter((e) => e.kind === 'component')).toHaveLength(0)
    expect(maps.client.entries.filter((e) => e.kind === 'component')).toHaveLength(0)
  })
})

describe('buildImportMaps — admin.validate edge cases', () => {
  it('handles object-form references with exportName', () => {
    const maps = buildImportMaps({
      collections: [
        {
          slug: 'users',
          fields: [
            {
              name: 'handle',
              type: 'text',
              admin: { validate: { path: '@/v/handle', exportName: 'format' } as any },
            },
          ],
        },
      ],
      globals: [],
    } as any)
    expect(maps.client.entries).toContainEqual(
      expect.objectContaining({
        kind: 'admin-validate',
        path: '@/v/handle',
        exportName: 'format',
      }),
    )
  })

  it('walks admin.validate refs inside arrays', () => {
    const maps = buildImportMaps({
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
                  admin: { validate: '@/validators/sku' },
                },
              ],
            },
          ],
        },
      ],
      globals: [],
    } as any)
    expect(maps.client.entries).toContainEqual(
      expect.objectContaining({
        fieldPath: 'orders.lineItems.*.sku',
        kind: 'admin-validate',
        path: '@/validators/sku',
      }),
    )
  })
})
