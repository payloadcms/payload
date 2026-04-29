import type { IndexedComponent } from 'payload'

import { describe, expect, it } from 'vitest'

import { createComponentIndexFromRefs } from './createComponentIndexFromRefs.js'

describe('createComponentIndexFromRefs', () => {
  it('returns empty array for an empty refs input', () => {
    const index = createComponentIndexFromRefs([])
    expect(index.componentsAt('posts.title')).toEqual([])
  })

  it('returns components matching the subtreePath exactly', () => {
    const refs: IndexedComponent[] = [
      { componentPath: '@/MyField', path: 'posts.title', slot: 'Field' },
    ]
    const index = createComponentIndexFromRefs(refs)
    expect(index.componentsAt('posts.title')).toEqual([refs[0]])
  })

  it('returns components rooted under a subtreePath', () => {
    const refs: IndexedComponent[] = [
      { componentPath: '@/A', path: 'posts.a.b.c', slot: 'Field' },
      { componentPath: '@/B', path: 'posts.x', slot: 'Field' },
    ]
    const index = createComponentIndexFromRefs(refs)
    expect(index.componentsAt('posts.a')).toEqual([refs[0]])
  })

  it('specializes wildcard paths to concrete indexes', () => {
    const refs: IndexedComponent[] = [
      { componentPath: '@/SkuField', path: 'orders.lineItems.*.sku', slot: 'Field' },
    ]
    const index = createComponentIndexFromRefs(refs)
    const out = index.componentsAt('orders.lineItems.5')
    expect(out).toHaveLength(1)
    expect(out[0]!.path).toBe('orders.lineItems.5.sku')
  })

  it('does not specialize when subtreePath segment is non-numeric', () => {
    const refs: IndexedComponent[] = [
      { componentPath: '@/SkuField', path: 'orders.lineItems.*.sku', slot: 'Field' },
    ]
    const index = createComponentIndexFromRefs(refs)
    expect(index.componentsAt('orders.lineItems.unrelated')).toEqual([])
  })

  it('returns an empty array for an empty subtreePath', () => {
    const refs: IndexedComponent[] = [{ componentPath: '@/A', path: 'posts.title', slot: 'Field' }]
    const index = createComponentIndexFromRefs(refs)
    expect(index.componentsAt('')).toEqual([])
  })

  it('exposes all() returning a copy of the original refs', () => {
    const refs: IndexedComponent[] = [{ componentPath: '@/A', path: 'posts.title', slot: 'Field' }]
    const index = createComponentIndexFromRefs(refs)
    const all = index.all()
    expect(all).toEqual(refs)
    expect(all).not.toBe(refs) // defensive copy
  })
})
