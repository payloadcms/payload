import { describe, it, expect } from 'vitest'
import { buildImportMaps } from './buildImportMaps.js'

describe('buildImportMaps', () => {
  it('puts a server-only validator only in the server map', () => {
    const maps = buildImportMaps(
      {
        collections: [{ slug: 'x', fields: [{ name: 'y', type: 'text', validate: () => true }] }],
        globals: [],
      } as any,
      () => 'server',
    )
    expect(maps.server.entries.some((e) => e.kind === 'validate')).toBe(true)
    expect(maps.client.entries.some((e) => e.kind === 'validate')).toBe(false)
  })

  it('puts admin.condition and admin.validate only in the client map', () => {
    const maps = buildImportMaps(
      {
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
      } as any,
      () => 'server',
    )
    expect(maps.client.entries.some((e) => e.kind === 'admin-validate' && e.path === '@/v/y')).toBe(
      true,
    )
    expect(maps.client.entries.some((e) => e.kind === 'admin-condition')).toBe(true)
    expect(maps.server.entries.some((e) => e.kind === 'admin-validate')).toBe(false)
    expect(maps.server.entries.some((e) => e.kind === 'admin-condition')).toBe(false)
  })

  it('puts a `kind: "server"` field component only in the server map', () => {
    const classify = (p: string) =>
      p.includes('Server') ? ('server' as const) : ('client' as const)
    const maps = buildImportMaps(
      {
        collections: [
          {
            slug: 'x',
            fields: [
              {
                name: 'y',
                type: 'text',
                admin: { components: { Field: { path: '@/MyServerField' } } },
              },
            ],
          },
        ],
        globals: [],
      } as any,
      classify,
    )
    expect(maps.server.entries.some((e) => e.path === '@/MyServerField')).toBe(true)
    expect(maps.client.entries.some((e) => e.path === '@/MyServerField')).toBe(false)
  })

  it('puts a `kind: "client"` field component in BOTH maps', () => {
    const classify = (p: string) =>
      p.includes('Client') ? ('client' as const) : ('server' as const)
    const maps = buildImportMaps(
      {
        collections: [
          {
            slug: 'x',
            fields: [
              {
                name: 'y',
                type: 'text',
                admin: { components: { Field: { path: '@/MyClientField' } } },
              },
            ],
          },
        ],
        globals: [],
      } as any,
      classify,
    )
    expect(maps.server.entries.some((e) => e.path === '@/MyClientField')).toBe(true)
    expect(maps.client.entries.some((e) => e.path === '@/MyClientField')).toBe(true)
  })
})
