import type { TreeViewItem } from 'payload/shared'

import type { ItemKey } from './itemsToSectionRows.js'

type GetAllDescendantIDsArgs = {
  /**
   * Item Keys of the items to get descendants for
   */
  itemKeys: Set<ItemKey>
  /**
   * All items in the tree
   */
  items: TreeViewItem[]
}

/**
 * Recursively collects all descendant IDs for the given item ID(s).
 * This is used to determine invalid drop targets when dragging tree items,
 * or to find all descendants of selected items.
 *
 * @returns Set containing the item ID(s) and all their descendant IDs at any depth
 *
 * @example
 * // Tree structure:
 * // A
 * // ├── B
 * // │   └── C
 * // └── D
 *
 * getAllDescendantIDs({ itemID: 'A', items: documents })
 * // Returns Set { 'A', 'B', 'C', 'D' }
 *
 * getAllDescendantIDs({ itemID: ['A', 'D'], items: documents })
 * // Returns Set { 'A', 'B', 'C', 'D' }
 */
export function getAllDescendantIDs({ itemKeys, items }: GetAllDescendantIDsArgs): Set<ItemKey> {
  const result = new Set<ItemKey>()

  const collectDescendants = (parentItemKey: ItemKey) => {
    items.forEach((doc) => {
      if (doc.parentItemKey === parentItemKey) {
        result.add(doc.itemKey)
        // Recursively collect this child's descendants
        collectDescendants(doc.itemKey)
      }
    })
  }

  itemKeys.forEach((itemKey) => {
    collectDescendants(itemKey)
  })

  return result
}
