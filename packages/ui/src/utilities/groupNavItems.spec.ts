import type { I18nClient } from '@payloadcms/translations'

import { EntityType } from 'payload'

import { describe, expect, it } from 'vitest'

import { groupNavItems, type EntityToGroup } from './groupNavItems.js'

const i18n = {
  t: (key: string) => {
    if (typeof key === 'string' && key.startsWith('general:')) {
      return key.split(':')[1]
    }
    return String(key)
  },
} as unknown as I18nClient

// Build a permissions object where every (type, slug) pair has read=true.
// isNavEntityVisible reads `permissions?.[type.toLowerCase()]?.[slug]?.read`.
// EntityType.collection === 'collections', EntityType.global === 'globals'.
function permsFor(entities: EntityToGroup[]) {
  const collections: Record<string, { read: boolean }> = {}
  const globals: Record<string, { read: boolean }> = {}
  for (const e of entities) {
    if (e.type === EntityType.collection) {
      collections[e.entity.slug] = { read: true }
    } else {
      globals[e.entity.slug] = { read: true }
    }
  }
  return { collections, globals }
}

function collection(slug: string, label: string, group?: false | string): EntityToGroup {
  return {
    type: EntityType.collection,
    entity: {
      slug,
      labels: { plural: label, singular: label },
      admin: group === undefined ? {} : { group },
    } as any,
  }
}

function globalEntity(slug: string, label: string, group?: false | string): EntityToGroup {
  return {
    type: EntityType.global,
    entity: {
      slug,
      label,
      admin: group === undefined ? {} : { group },
    } as any,
  }
}

describe('groupNavItems', () => {
  it('keeps the default Collections-first / Globals-second order when groupOrder is omitted', () => {
    const entities = [
      collection('zebra', 'Zebras', 'Animals'),
      collection('banana', 'Bananas'),
      globalEntity('header', 'Header', 'Layout'),
    ]

    const result = groupNavItems(entities, permsFor(entities) as any, i18n)

    expect(result.map((g) => g.label)).toEqual(['collections', 'Animals', 'Layout'])
  })

  it('reorders groups to match admin.groups when provided', () => {
    const entities = [
      collection('zebra', 'Zebras', 'Animals'),
      collection('apple', 'Apples', 'Food'),
      collection('settings', 'Settings', 'System'),
      collection('banana', 'Bananas'),
      globalEntity('header', 'Header', 'Layout'),
    ]

    const groupOrder = ['System', 'Animals', 'Food', 'Layout', 'collections']

    const result = groupNavItems(entities, permsFor(entities) as any, i18n, groupOrder)

    expect(result.map((g) => g.label)).toEqual([
      'System',
      'Animals',
      'Food',
      'Layout',
      'collections',
    ])
  })

  it('appends groups not listed in admin.groups after the listed ones, in first-encounter order', () => {
    const entities = [
      collection('zebra', 'Zebras', 'Animals'),
      collection('apple', 'Apples', 'Food'), // Food is NOT in groupOrder
    ]

    const result = groupNavItems(entities, permsFor(entities) as any, i18n, ['Animals'])

    expect(result.map((g) => g.label)).toEqual(['Animals', 'Food'])
  })

  it('preserves item order within each group', () => {
    const entities = [
      collection('zebra', 'Zebras', 'Animals'),
      collection('tiger', 'Tigers', 'Animals'),
    ]

    const result = groupNavItems(entities, permsFor(entities) as any, i18n, ['Animals'])

    expect(result[0].entities.map((e) => e.slug)).toEqual(['zebra', 'tiger'])
  })

  it('keeps default behavior when admin.groups is an empty array', () => {
    const entities = [collection('zebra', 'Zebras', 'Animals')]

    const result = groupNavItems(entities, permsFor(entities) as any, i18n, [])

    expect(result.map((g) => g.label)).toEqual(['Animals'])
  })
})
