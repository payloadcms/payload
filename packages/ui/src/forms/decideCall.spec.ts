import { describe, expect, it } from 'vitest'

import type { ComponentIndex, IndexedComponent } from 'payload'

import { decideCall } from './decideCall.js'

const skuFieldPath = 'orders.lineItems.*.sku'
const advancedPath = 'posts.advanced'
const galleryPath = 'posts.gallery'

const sku: IndexedComponent = {
  componentPath: '@/SkuField',
  path: skuFieldPath,
  slot: 'Field',
}

const advanced: IndexedComponent = {
  componentPath: '@/AdvancedField',
  path: advancedPath,
  slot: 'Field',
}

const gallery: IndexedComponent = {
  componentPath: '@/Gallery',
  path: galleryPath,
  slot: 'Field',
}

const stubIndex: ComponentIndex = {
  all: () => [sku, advanced, gallery],
  componentsAt: (subtreePath: string) => {
    // Simulate componentIndex.componentsAt with wildcard specialization.
    if (subtreePath.startsWith('orders.lineItems') && /\.\d+\.sku$/.test(subtreePath)) {
      return [{ ...sku, path: subtreePath }]
    }
    if (subtreePath.startsWith('orders.lineItems') && /\.\d+$/.test(subtreePath)) {
      return [{ ...sku, path: `${subtreePath}.sku` }]
    }
    if (subtreePath === advancedPath) {
      return [advanced]
    }
    if (subtreePath === galleryPath) {
      return [gallery]
    }
    return []
  },
}

const empty = () => new Map<string, boolean>()

describe('decideCall', () => {
  it('returns null when nothing structural or visibility-related changed', () => {
    const result = decideCall({
      index: stubIndex,
      next: { values: { 'orders.notes': 'hi' }, visibility: empty() },
      prev: { values: { 'orders.notes': '' }, visibility: empty() },
      realized: new Set(),
    })
    expect(result).toBeNull()
  })

  it('routes a structural add into the targets list', () => {
    const result = decideCall({
      index: stubIndex,
      next: { values: { 'orders.lineItems': [{ sku: 'a' }, { sku: 'b' }] }, visibility: empty() },
      prev: { values: { 'orders.lineItems': [{ sku: 'a' }] }, visibility: empty() },
      realized: new Set(),
    })
    expect(result).not.toBeNull()
    expect(result!.targets).toEqual([{ path: 'orders.lineItems.1.sku', slot: 'Field' }])
  })

  it('returns null on row removal', () => {
    const result = decideCall({
      index: stubIndex,
      next: { values: { 'orders.lineItems': [{ sku: 'a' }] }, visibility: empty() },
      prev: { values: { 'orders.lineItems': [{ sku: 'a' }, { sku: 'b' }] }, visibility: empty() },
      realized: new Set(),
    })
    expect(result).toBeNull()
  })

  it('returns null on a row reorder (with ids)', () => {
    const result = decideCall({
      index: stubIndex,
      next: {
        values: {
          'orders.lineItems': [
            { id: '2', sku: 'b' },
            { id: '1', sku: 'a' },
          ],
        },
        visibility: empty(),
      },
      prev: {
        values: {
          'orders.lineItems': [
            { id: '1', sku: 'a' },
            { id: '2', sku: 'b' },
          ],
        },
        visibility: empty(),
      },
      realized: new Set(),
    })
    expect(result).toBeNull()
  })

  it('routes a visibility reveal into the targets list', () => {
    const result = decideCall({
      index: stubIndex,
      next: { values: {}, visibility: new Map([[advancedPath, true]]) },
      prev: { values: {}, visibility: new Map([[advancedPath, false]]) },
      realized: new Set(),
    })
    expect(result).toEqual({
      targets: [{ path: advancedPath, slot: 'Field' }],
    })
  })

  it('skips a target already in the realized set', () => {
    const result = decideCall({
      index: stubIndex,
      next: { values: {}, visibility: new Map([[advancedPath, true]]) },
      prev: { values: {}, visibility: new Map([[advancedPath, false]]) },
      realized: new Set([`${advancedPath}|Field`]),
    })
    expect(result).toBeNull()
  })

  it('returns null when a condition flips true to false', () => {
    const result = decideCall({
      index: stubIndex,
      next: { values: {}, visibility: new Map([[advancedPath, false]]) },
      prev: { values: {}, visibility: new Map([[advancedPath, true]]) },
      realized: new Set(),
    })
    expect(result).toBeNull()
  })

  it('combines structural-add and visibility-reveal in one batch', () => {
    const result = decideCall({
      index: stubIndex,
      next: {
        values: { 'orders.lineItems': [{ sku: 'a' }, { sku: 'b' }] },
        visibility: new Map([[advancedPath, true]]),
      },
      prev: {
        values: { 'orders.lineItems': [{ sku: 'a' }] },
        visibility: new Map([[advancedPath, false]]),
      },
      realized: new Set(),
    })
    expect(result).not.toBeNull()
    // Target list contains both reveals — order doesn't matter.
    const paths = result!.targets.map((t) => t.path).sort()
    expect(paths).toEqual([advancedPath, 'orders.lineItems.1.sku'].sort())
  })

  it('deduplicates the same target across structural and visibility triggers', () => {
    const result = decideCall({
      index: stubIndex,
      next: {
        values: { 'orders.lineItems': [{ sku: 'a' }, { sku: 'b' }] },
        visibility: new Map([['orders.lineItems.1.sku', true]]),
      },
      prev: {
        values: { 'orders.lineItems': [{ sku: 'a' }] },
        visibility: new Map([['orders.lineItems.1.sku', false]]),
      },
      realized: new Set(),
    })
    expect(result).not.toBeNull()
    expect(result!.targets).toHaveLength(1)
    expect(result!.targets[0]).toEqual({ path: 'orders.lineItems.1.sku', slot: 'Field' })
  })
})
