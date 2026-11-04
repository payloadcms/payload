import type { LexicalEditor } from 'lexical'

import type { SlashMenuGroup } from './LexicalTypeaheadMenuPlugin/types.js'

type DynamicGroupFn = (args: { editor: LexicalEditor; queryString: string }) => SlashMenuGroup[]

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
