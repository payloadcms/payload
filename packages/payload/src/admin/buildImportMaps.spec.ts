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
})
