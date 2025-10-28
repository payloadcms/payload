import type { TreeViewItem } from 'payload/shared'

type GetAllDescendantIDsArgs = {
  /**
   * IDs of the items to get descendants for
   */
  itemIDs: (number | string)[]
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
export function getAllDescendantIDs({
  itemIDs,
  items,
}: GetAllDescendantIDsArgs): Set<number | string> {
  const result = new Set<number | string>()

  const collectDescendants = (parentID: number | string) => {
    items.forEach((doc) => {
      if (doc.value.parentID === parentID) {
        result.add(doc.value.id)
        // Recursively collect this child's descendants
        collectDescendants(doc.value.id)
      }
    })
  }

  itemIDs.forEach((id) => {
    collectDescendants(id)
  })

  return result
}
