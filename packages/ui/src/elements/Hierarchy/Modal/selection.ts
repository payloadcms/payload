import type { SelectionWithPath } from './types.js'

export const createHierarchySelections = ({
  hasMany,
  initialSelections,
}: {
  hasMany: boolean
  initialSelections?: (number | string)[]
}): Map<number | string, SelectionWithPath> => {
  const selections = new Map<number | string, SelectionWithPath>()
  const selectionsToCreate = hasMany ? initialSelections : initialSelections?.slice(0, 1)

  for (const id of selectionsToCreate ?? []) {
    selections.set(id, { id, path: [] })
  }

  return selections
}

export const selectHierarchyItem = ({
  id,
  current,
  hasMany,
  path,
}: {
  current: Map<number | string, SelectionWithPath>
  hasMany: boolean
  id: number | string
  path: SelectionWithPath['path']
}): Map<number | string, SelectionWithPath> => {
  const next = new Map(current)

  if (!hasMany) {
    next.clear()
    next.set(id, { id, path })
    return next
  }

  if (next.has(id)) {
    next.delete(id)
  } else {
    next.set(id, { id, path })
  }

  return next
}
