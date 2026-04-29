import { describe, expect, it } from 'vitest'

import type { ComponentIndex, IndexedComponent } from './buildComponentIndex.js'
import type { SanitizedConfig } from './types.js'

import { collectComponentRefs } from './client.js'

function makeConfig(componentIndex?: ComponentIndex): SanitizedConfig {
  return { componentIndex } as unknown as SanitizedConfig
}

function makeIndex(components: IndexedComponent[]): ComponentIndex {
  return {
    all: () => components.slice(),
    componentsAt: (subtreePath: string) =>
      components.filter((c) => c.path === subtreePath || c.path.startsWith(`${subtreePath}.`)),
  }
}

describe('collectComponentRefs', () => {
  it('returns an empty array for a config with no componentIndex', () => {
    expect(collectComponentRefs(makeConfig(undefined))).toEqual([])
  })

  it('projects flat IndexedComponent entries from componentIndex.all()', () => {
    const refs: IndexedComponent[] = [
      {
        componentPath: '@/components/Title#TitleField',
        kind: 'client',
        path: 'posts.title',
        slot: 'Field',
      },
      {
        componentPath: '@/components/Body#BodyField',
        kind: 'server',
        path: 'posts.body',
        slot: 'Field',
      },
    ]
    expect(collectComponentRefs(makeConfig(makeIndex(refs)))).toEqual(refs)
  })

  it('does not leak componentIndex methods (componentsAt, all)', () => {
    const refs: IndexedComponent[] = [
      {
        componentPath: '@/components/Title#TitleField',
        kind: 'client',
        path: 'posts.title',
        slot: 'Field',
      },
    ]
    const projected = collectComponentRefs(makeConfig(makeIndex(refs)))
    for (const entry of projected) {
      expect((entry as Record<string, unknown>).all).toBeUndefined()
      expect((entry as Record<string, unknown>).componentsAt).toBeUndefined()
      expect(Object.keys(entry).sort()).toEqual(['componentPath', 'kind', 'path', 'slot'])
    }
  })

  it('preserves wildcard paths (e.g., orders.lineItems.*.sku)', () => {
    const refs: IndexedComponent[] = [
      {
        componentPath: '@/components/Sku#SkuField',
        kind: 'server',
        path: 'orders.lineItems.*.sku',
        slot: 'Field',
      },
    ]
    const projected = collectComponentRefs(makeConfig(makeIndex(refs)))
    expect(projected).toHaveLength(1)
    expect(projected[0]!.path).toBe('orders.lineItems.*.sku')
  })

  it('includes all slot kinds (Field, beforeInput, afterInput, Label, Description, Error, RowLabel)', () => {
    const refs: IndexedComponent[] = [
      { componentPath: '@/c#Field', kind: 'client', path: 'posts.title', slot: 'Field' },
      { componentPath: '@/c#Before', kind: 'client', path: 'posts.title', slot: 'beforeInput' },
      { componentPath: '@/c#After', kind: 'client', path: 'posts.title', slot: 'afterInput' },
      { componentPath: '@/c#Label', kind: 'client', path: 'posts.title', slot: 'Label' },
      { componentPath: '@/c#Desc', kind: 'client', path: 'posts.title', slot: 'Description' },
      { componentPath: '@/c#Err', kind: 'client', path: 'posts.title', slot: 'Error' },
      { componentPath: '@/c#RowLabel', kind: 'client', path: 'posts.tags.*', slot: 'RowLabel' },
    ]
    const projected = collectComponentRefs(makeConfig(makeIndex(refs)))
    const slots = projected.map((r) => r.slot).sort()
    expect(slots).toEqual(
      ['Description', 'Error', 'Field', 'Label', 'RowLabel', 'afterInput', 'beforeInput'].sort(),
    )
  })

  it('preserves the kind tag from componentIndex entries', () => {
    const refs: IndexedComponent[] = [
      { componentPath: '@/c#Client', kind: 'client', path: 'posts.title', slot: 'Field' },
      { componentPath: '@/c#Server', kind: 'server', path: 'posts.body', slot: 'Field' },
    ]
    const projected = collectComponentRefs(makeConfig(makeIndex(refs)))
    expect(projected.find((r) => r.path === 'posts.title')?.kind).toBe('client')
    expect(projected.find((r) => r.path === 'posts.body')?.kind).toBe('server')
  })
})
