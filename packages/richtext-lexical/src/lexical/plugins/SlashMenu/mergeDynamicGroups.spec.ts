import type { LexicalEditor } from 'lexical'

import { describe, expect, it, vi } from 'vitest'

import type { SlashMenuGroup, SlashMenuItem } from './LexicalTypeaheadMenuPlugin/types.js'

import {
  applyDynamicGroups,
  mergeDynamicGroups,
  resolveSlashMenuGroups,
} from './mergeDynamicGroups.js'

const editor = {} as LexicalEditor

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

const createGroup = ({
  items,
  key,
  label,
}: {
  items: SlashMenuItem[]
  key: string
  label?: string
}): SlashMenuGroup => ({
  items,
  key,
  ...(label !== undefined ? { label } : {}),
})

describe('applyDynamicGroups', () => {
  it("should call each dynamicGroups callback with queryString '' and include its items for a bare slash", () => {
    const staticItem = createItem({ key: 'paragraph' })
    const dynamicItemA = createItem({ key: 'dynamic-a' })
    const dynamicItemB = createItem({ key: 'dynamic-b' })
    const groups = [createGroup({ items: [staticItem], key: 'basic' })]
    const dynamicGroupFnA = vi.fn(() => [createGroup({ items: [dynamicItemA], key: 'basic' })])
    const dynamicGroupFnB = vi.fn(() => [createGroup({ items: [dynamicItemB], key: 'custom' })])

    const result = applyDynamicGroups({
      dynamicGroupFns: [dynamicGroupFnA, dynamicGroupFnB],
      editor,
      groups,
      queryString: '',
    })

    expect(dynamicGroupFnA).toHaveBeenCalledTimes(1)
    expect(dynamicGroupFnA).toHaveBeenCalledWith({ editor, queryString: '' })
    expect(dynamicGroupFnB).toHaveBeenCalledTimes(1)
    expect(dynamicGroupFnB).toHaveBeenCalledWith({ editor, queryString: '' })
    expect(result.map((group) => group.key)).toEqual(['basic', 'custom'])
    expect(result[0]!.items.map((item) => item.key)).toEqual(['paragraph', 'dynamic-a'])
    expect(result[1]!.items.map((item) => item.key)).toEqual(['dynamic-b'])
  })

  it('should not call dynamicGroups callbacks when queryString is null', () => {
    const groups = [createGroup({ items: [createItem({ key: 'paragraph' })], key: 'basic' })]
    const dynamicGroupFn = vi.fn(() => [
      createGroup({ items: [createItem({ key: 'dynamic' })], key: 'custom' }),
    ])

    const result = applyDynamicGroups({
      dynamicGroupFns: [dynamicGroupFn],
      editor,
      groups,
      queryString: null,
    })

    expect(dynamicGroupFn).not.toHaveBeenCalled()
    expect(result).toBe(groups)
    expect(result.map((group) => group.key)).toEqual(['basic'])
  })
})

describe('resolveSlashMenuGroups', () => {
  it('should keep configured group position and label when query filters out all static items and dynamic groups refill that key', () => {
    const groups = [
      createGroup({
        items: [createItem({ key: 'paragraph' })],
        key: 'basic',
        label: 'Basic',
      }),
      createGroup({
        items: [createItem({ key: 'upload' })],
        key: 'media',
        label: 'Media',
      }),
      createGroup({
        items: [createItem({ key: 'code' })],
        key: 'advanced',
        label: 'Advanced',
      }),
    ]
    const dynamicItem = createItem({ key: 'custom-paragraph' })
    const dynamicGroupFn = vi.fn(() => [
      createGroup({
        items: [dynamicItem],
        key: 'basic',
        label: 'Dynamic Basic',
      }),
    ])

    const result = resolveSlashMenuGroups({
      dynamicGroupFns: [dynamicGroupFn],
      editor,
      filterItem: (item) => item.key.includes('upload'),
      groups,
      queryString: 'up',
    })

    expect(result.map((group) => group.key)).toEqual(['basic', 'media'])
    expect(result[0]!.label).toBe('Basic')
    expect(result[0]!.items.map((item) => item.key)).toEqual(['custom-paragraph'])
    expect(result[1]!.items.map((item) => item.key)).toEqual(['upload'])
    expect(dynamicGroupFn).toHaveBeenCalledWith({ editor, queryString: 'up' })
  })
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
