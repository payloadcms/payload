import type { ItemKey, SectionItem } from './types.js'

export interface GetItemByPathArgs {
  indexPath: number[]
  rootItems: SectionItem[]
}

export interface GetNextVisibleItemArgs {
  indexPath: number[]
  openItemKeys: Set<ItemKey>
  rootItems: SectionItem[]
}

export interface GetPreviousVisibleItemArgs {
  indexPath: number[]
  openItemKeys: Set<ItemKey>
  rootItems: SectionItem[]
}

export interface GetItemKeysBetweenArgs {
  filterFn?: (item: SectionItem) => boolean
  itemKeyA: ItemKey
  itemKeyB: ItemKey
  openItemKeys: Set<ItemKey>
  rootItems: SectionItem[]
}

export interface FindItemPathArgs {
  itemKey: ItemKey
  rootItems: SectionItem[]
}

/**
 * Retrieves an item from the tree structure by following the specified index path.
 *
 * @param args - Configuration object
 * @param args.indexPath - Array of indices representing the path to the item (e.g., [0, 2, 1] for first item -> third child -> second grandchild)
 * @param args.rootItems - The root-level items of the tree
 * @returns The item at the specified path, or undefined if not found
 *
 * @example
 * const item = getItemByPath({ indexPath: [0, 2], allItems: rootItems })
 */
export const getItemByPath = ({
  indexPath,
  rootItems: allItems,
}: GetItemByPathArgs): SectionItem | undefined => {
  let current = allItems
  for (let i = 0; i < indexPath.length; i++) {
    const item = current?.[indexPath[i]]
    if (!item) {
      return undefined
    }
    if (i === indexPath.length - 1) {
      return item
    }
    current = item.rows
  }
  return undefined
}

/**
 * Finds the next visible item in the tree, respecting the current expand/collapse state.
 * Navigation follows depth-first order: children first, then siblings, then parent's siblings.
 *
 * @param args - Configuration object
 * @param args.indexPath - Array of indices representing the current item's path
 * @param args.allItems - The root-level items of the tree
 * @param args.openItemKeys - Set of item keys that are currently expanded
 * @returns The next visible item, or undefined if there is no next item
 *
 * @example
 * const nextItem = getNextVisibleItem({ indexPath: [0, 1], allItems: rootItems, openItemKeys })
 */
export const getNextVisibleItem = ({
  indexPath,
  openItemKeys,
  rootItems: rootItems,
}: GetNextVisibleItemArgs): SectionItem | undefined => {
  if (indexPath.length === 0) {
    return undefined
  }

  const currentItem = getItemByPath({ indexPath, rootItems })
  // If current item has visible children, navigate to first child
  if (currentItem?.rows?.length && openItemKeys?.has(currentItem.itemKey)) {
    return currentItem.rows[0]
  }

  // Otherwise, navigate to next sibling or parent's next sibling
  let searchPath = [...indexPath]
  while (searchPath.length > 0) {
    const lastIndex = searchPath[searchPath.length - 1]
    const parentPath = searchPath.slice(0, -1)
    const siblings =
      parentPath.length === 0
        ? rootItems
        : getItemByPath({ indexPath: parentPath, rootItems })?.rows || []

    // Check if there's a next sibling
    if (lastIndex + 1 < siblings.length) {
      return siblings[lastIndex + 1]
    }

    // Move up to parent and try again
    searchPath = parentPath
  }

  return undefined
}

/**
 * Finds the previous visible item in the tree, respecting the current expand/collapse state.
 * Navigation follows reverse depth-first order: previous sibling's deepest visible child, then parent.
 *
 * @param args - Configuration object
 * @param args.indexPath - Array of indices representing the current item's path
 * @param args.allItems - The root-level items of the tree
 * @param args.openItemKeys - Set of item keys that are currently expanded
 * @returns The previous visible item, or undefined if there is no previous item
 *
 * @example
 * const prevItem = getPreviousVisibleItem({ indexPath: [0, 1], allItems: rootItems, openItemKeys })
 */
export const getPreviousVisibleItem = ({
  indexPath,
  openItemKeys,
  rootItems: allItems,
}: GetPreviousVisibleItemArgs): SectionItem | undefined => {
  if (indexPath.length === 0) {
    return undefined
  }

  const lastIndex = indexPath[indexPath.length - 1]

  // If there's a previous sibling, navigate to its deepest visible child
  if (lastIndex > 0) {
    const parentPath = indexPath.slice(0, -1)
    const siblings =
      parentPath.length === 0
        ? allItems
        : getItemByPath({ indexPath: parentPath, rootItems: allItems })?.rows || []
    let targetItem = siblings[lastIndex - 1]

    // Navigate to the deepest visible child
    while (targetItem?.rows?.length && openItemKeys?.has(targetItem.itemKey)) {
      targetItem = targetItem.rows[targetItem.rows.length - 1]
    }

    return targetItem
  }

  // Otherwise, navigate to parent
  if (indexPath.length > 1) {
    return getItemByPath({ indexPath: indexPath.slice(0, -1), rootItems: allItems })
  }

  return undefined
}

/**
 * Finds the index path of an item by its itemKey.
 *
 * @param args - Configuration object
 * @param args.itemKey - The itemKey to search for
 * @param args.rootItems - The root-level items of the tree
 * @returns The index path to the item, or undefined if not found
 *
 * @example
 * const path = findItemPath({ itemKey: 'section-123', rootItems })
 * // Returns [0, 2, 1] if the item is at rootItems[0].rows[2].rows[1]
 */
export const findItemPath = ({ itemKey, rootItems }: FindItemPathArgs): number[] | undefined => {
  const search = (items: SectionItem[], currentPath: number[]): number[] | undefined => {
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const newPath = [...currentPath, i]

      if (item.itemKey === itemKey) {
        return newPath
      }

      if (item.rows?.length) {
        const found = search(item.rows, newPath)
        if (found) {
          return found
        }
      }
    }
    return undefined
  }

  return search(rootItems, [])
}

/**
 * Compares two index paths to determine their order in the tree.
 *
 * @param pathA - First index path
 * @param pathB - Second index path
 * @returns Negative if pathA comes before pathB, positive if after, 0 if equal
 */
const compareIndexPaths = (pathA: number[], pathB: number[]): number => {
  const minLength = Math.min(pathA.length, pathB.length)

  for (let i = 0; i < minLength; i++) {
    if (pathA[i] !== pathB[i]) {
      return pathA[i] - pathB[i]
    }
  }

  // If all compared indices are equal, the shorter path comes first
  return pathA.length - pathB.length
}

/**
 * Gathers all itemKeys between two items in the tree, inclusive of both items.
 * Only includes visible items (respecting the current expand/collapse state).
 * Automatically determines which item comes first and handles the range accordingly.
 *
 * @param args - Configuration object
 * @param args.itemKeyA - The itemKey of one end of the range
 * @param args.itemKeyB - The itemKey of the other end of the range
 * @param args.rootItems - The root-level items of the tree
 * @param args.openItemKeys - Set of item keys that are currently expanded
 * @param args.filterFn - Optional filter function to exclude certain items from the result
 * @returns Array of itemKeys in the range (in order), or empty array if either item is not found
 *
 * @example
 * // Works regardless of which item comes first in the tree
 * const keys = getItemKeysBetween({
 *   itemKeyA: 'section-5',
 *   itemKeyB: 'section-1',
 *   rootItems,
 *   openItemKeys,
 *   filterFn: (item) => item.isEnabled // optional filter
 * })
 */
export const getItemKeysBetween = ({
  filterFn,
  itemKeyA,
  itemKeyB,
  openItemKeys,
  rootItems,
}: GetItemKeysBetweenArgs): ItemKey[] => {
  const pathA = findItemPath({ itemKey: itemKeyA, rootItems })
  const pathB = findItemPath({ itemKey: itemKeyB, rootItems })

  if (!pathA || !pathB) {
    return []
  }

  // Determine which path comes first
  const comparison = compareIndexPaths(pathA, pathB)

  // If the paths are the same, return just that one item
  if (comparison === 0) {
    const item = getItemByPath({ indexPath: pathA, rootItems })
    if (item && (!filterFn || filterFn(item))) {
      return [item.itemKey]
    }
    return []
  }

  // Swap if necessary so firstPath always comes before lastPath
  const [firstPath, _lastPath, lastKey] =
    comparison < 0 ? [pathA, pathB, itemKeyB] : [pathB, pathA, itemKeyA]

  const result: ItemKey[] = []
  let currentPath = firstPath

  // Collect items from first to last
  while (currentPath) {
    const currentItem = getItemByPath({ indexPath: currentPath, rootItems })

    if (currentItem) {
      // Apply filter if provided
      if (!filterFn || filterFn(currentItem)) {
        result.push(currentItem.itemKey)
      }

      // Stop if we've reached the last item
      if (currentItem.itemKey === lastKey) {
        break
      }
    }

    // Move to the next visible item
    const nextItem = getNextVisibleItem({ indexPath: currentPath, openItemKeys, rootItems })
    if (!nextItem) {
      break
    }

    // Find the path of the next item
    const nextPath = findItemPath({ itemKey: nextItem.itemKey, rootItems })
    if (!nextPath) {
      break
    }

    currentPath = nextPath
  }

  return result
}
