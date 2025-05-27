import type { FolderOrDocument } from 'payload/shared'

export function getShiftSelection({
  selectFromIndex,
  selectToIndex,
}: {
  selectFromIndex: number
  selectToIndex: number
}): Set<number> {
  if (selectFromIndex === null || selectFromIndex === undefined) {
    return new Set([selectToIndex])
  }

  const start = Math.min(selectToIndex, selectFromIndex)
  const end = Math.max(selectToIndex, selectFromIndex)
  const rangeSelection = new Set(
    Array.from({ length: Math.max(start, end) + 1 }, (_, i) => i).filter((index) => {
      return index >= start && index <= end
    }),
  )
  return rangeSelection
}

export function getMetaSelection({
  currentSelection,
  toggleIndex,
}: {
  currentSelection: Set<number>
  toggleIndex: number
}): Set<number> {
  const newSelection = new Set(currentSelection)
  if (newSelection.has(toggleIndex)) {
    newSelection.delete(toggleIndex)
  } else {
    newSelection.add(toggleIndex)
  }
  return newSelection
}

export function groupItemIDsByRelation(items: FolderOrDocument[]) {
  return items.reduce(
    (acc, item) => {
      if (!acc[item.relationTo]) {
        acc[item.relationTo] = []
      }
      acc[item.relationTo].push(item.value.id)

      return acc
    },
    {} as Record<string, (number | string)[]>,
  )
}
