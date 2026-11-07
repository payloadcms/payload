import type { LexicalEditor } from 'lexical'

import type { SlashMenuGroup, SlashMenuItem } from './LexicalTypeaheadMenuPlugin/types.js'

type DynamicGroupFn = (args: { editor: LexicalEditor; queryString: string }) => SlashMenuGroup[]

/**
 * Filters configured slash-menu groups by `filterItem`, merges `dynamicGroups`
 * results, then drops empty groups when `queryString` is non-empty.
 * Keeps configured group order and labels through the merge so a dynamic group
 * with a matching key can refill a group whose static items were all filtered out.
 * When `queryString` is `null` (menu closed), returns `groups` unchanged.
 * An empty string (bare `/`) skips item filtering and empty-group pruning.
 */
export function resolveSlashMenuGroups({
  dynamicGroupFns,
  editor,
  filterItem,
  groups,
  queryString,
}: {
  dynamicGroupFns: DynamicGroupFn[]
  editor: LexicalEditor
  filterItem?: (item: SlashMenuItem) => boolean
  groups: SlashMenuGroup[]
  queryString: null | string
}): SlashMenuGroup[] {
  let groupsWithItems = groups

  if (queryString && filterItem) {
    // Keep empty groups so mergeDynamicGroups can refill matching keys in place
    groupsWithItems = groups.map((group) => ({
      ...group,
      items: group.items.filter(filterItem),
    }))
  }

  const mergedGroups = applyDynamicGroups({
    dynamicGroupFns,
    editor,
    groups: groupsWithItems,
    queryString,
  })

  // Bare '/' (queryString === '') keeps empty groups; non-empty queries prune them
  if (queryString) {
    return mergedGroups.filter((group) => group.items.length > 0)
  }

  return mergedGroups
}

/**
 * Invokes slash-menu `dynamicGroups` callbacks when the menu is open and merges
 * their results into `groups`. When `queryString` is `null` (menu closed),
 * returns `groups` unchanged without calling any callbacks. An empty string
 * (bare `/`) still invokes each callback with `queryString: ''`.
 */
export function applyDynamicGroups({
  dynamicGroupFns,
  editor,
  groups,
  queryString,
}: {
  dynamicGroupFns: DynamicGroupFn[]
  editor: LexicalEditor
  groups: SlashMenuGroup[]
  queryString: null | string
}): SlashMenuGroup[] {
  // queryString is '' for a bare '/', and null when the menu is closed
  if (queryString == null) {
    return groups
  }

  let dynamicGroups: SlashMenuGroup[] = []

  for (const dynamicGroupFn of dynamicGroupFns) {
    dynamicGroups = dynamicGroups.concat(
      dynamicGroupFn({
        editor,
        queryString,
      }),
    )
  }

  return mergeDynamicGroups({
    dynamicGroups,
    groups,
  })
}

/**
 * Merges slash-menu dynamic groups into the current groups list.
 * Does not mutate the input arrays or group/item objects.
 * Existing groups keep their position; new groups are appended.
 */
export function mergeDynamicGroups({
  dynamicGroups,
  groups,
}: {
  dynamicGroups: SlashMenuGroup[]
  groups: SlashMenuGroup[]
}): SlashMenuGroup[] {
  const result: SlashMenuGroup[] = groups.map((group) => ({
    ...group,
    items: [...group.items],
  }))

  for (const dynamicGroup of dynamicGroups) {
    const existingIndex = result.findIndex((group) => group.key === dynamicGroup.key)

    if (existingIndex === -1) {
      result.push({
        ...dynamicGroup,
        items: [...dynamicGroup.items],
      })
      continue
    }

    const existingGroup = result[existingIndex]!

    result[existingIndex] = {
      ...existingGroup,
      items: [...existingGroup.items, ...dynamicGroup.items],
    }
  }

  return result
}
