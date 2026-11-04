import type { SlashMenuGroup } from './LexicalTypeaheadMenuPlugin/types.js'

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
