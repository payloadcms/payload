import type { LexicalEditor } from 'lexical'

import { describe, expect, it } from 'vitest'

import type { SlashMenuGroup, SlashMenuItem } from './LexicalTypeaheadMenuPlugin/types.js'

import { mergeDynamicGroups } from './mergeDynamicGroups.js'

const createItem = ({ key }: { key: string }): SlashMenuItem => ({
  Icon: () => null,
  key,
  onSelect: ({
    editor: _editor,
    queryString: _queryString,
  }: {
    editor: LexicalEditor
    queryString: string
  }) => {
    return
  },
})

const createGroup = ({ items, key }: { items: SlashMenuItem[]; key: string }): SlashMenuGroup => ({
  items,
  key,
})

describe('mergeDynamicGroups', () => {
  it('should concatenate static and dynamic items for an existing group key without self-duplication', () => {
    const staticItem = createItem({ key: 'paragraph' })
    const dynamicItem = createItem({ key: 'custom-block' })
    const groups = [createGroup({ items: [staticItem], key: 'basic' })]
    const dynamicGroups = [createGroup({ items: [dynamicItem], key: 'basic' })]

    const result = mergeDynamicGroups({ dynamicGroups, groups })

    expect(result).toHaveLength(1)
    expect(result[0]!.key).toBe('basic')
    expect(result[0]!.items.map((item) => item.key)).toEqual(['paragraph', 'custom-block'])
  })

  it('should keep a matched group in its original position', () => {
    const groups = [
      createGroup({ items: [createItem({ key: 'a' })], key: 'first' }),
      createGroup({ items: [createItem({ key: 'b' })], key: 'second' }),
      createGroup({ items: [createItem({ key: 'c' })], key: 'third' }),
    ]
    const dynamicGroups = [createGroup({ items: [createItem({ key: 'b2' })], key: 'second' })]

    const result = mergeDynamicGroups({ dynamicGroups, groups })

    expect(result.map((group) => group.key)).toEqual(['first', 'second', 'third'])
    expect(result[1]!.items.map((item) => item.key)).toEqual(['b', 'b2'])
  })

  it('should append a new group with its dynamic items', () => {
    const groups = [createGroup({ items: [createItem({ key: 'paragraph' })], key: 'basic' })]
    const dynamicItem = createItem({ key: 'dynamic-only' })
    const dynamicGroups = [createGroup({ items: [dynamicItem], key: 'custom' })]

    const result = mergeDynamicGroups({ dynamicGroups, groups })

    expect(result.map((group) => group.key)).toEqual(['basic', 'custom'])
    expect(result[1]!.items.map((item) => item.key)).toEqual(['dynamic-only'])
  })

  it('should not mutate the input groups or dynamic groups', () => {
    const staticItem = createItem({ key: 'paragraph' })
    const dynamicItem = createItem({ key: 'custom-block' })
    const groups = [createGroup({ items: [staticItem], key: 'basic' })]
    const dynamicGroups = [createGroup({ items: [dynamicItem], key: 'basic' })]
    const groupsSnapshot = structuredClone({
      items: groups[0]!.items.map((item) => item.key),
      key: groups[0]!.key,
    })
    const dynamicSnapshot = structuredClone({
      items: dynamicGroups[0]!.items.map((item) => item.key),
      key: dynamicGroups[0]!.key,
    })
    const groupsRef = groups[0]!
    const dynamicRef = dynamicGroups[0]!
    const staticItemsRef = groupsRef.items
    const dynamicItemsRef = dynamicRef.items

    mergeDynamicGroups({ dynamicGroups, groups })

    expect(groups[0]).toBe(groupsRef)
    expect(dynamicGroups[0]).toBe(dynamicRef)
    expect(groupsRef.items).toBe(staticItemsRef)
    expect(dynamicRef.items).toBe(dynamicItemsRef)
    expect(groupsRef.items.map((item) => item.key)).toEqual(groupsSnapshot.items)
    expect(dynamicRef.items.map((item) => item.key)).toEqual(dynamicSnapshot.items)
  })
})
