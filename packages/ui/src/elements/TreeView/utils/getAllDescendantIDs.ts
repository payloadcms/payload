import type { TreeViewDocument } from 'payload/shared'

/**
 * Recursively collects all descendant IDs for the given parent IDs.
 * This is used to determine invalid drop targets when dragging tree items.
 *
 * @param draggedItemIDs - Array of IDs for items being dragged
 * @param documents - All documents in the tree
 * @returns Set containing the dragged IDs and all their descendant IDs at any depth
 *
 * @example
 * // Tree structure:
 * // A
 * // ├── B
 * // │   └── C
 * // └── D
 *
 * getAllDescendantIDs(['A'], documents)
 * // Returns Set { 'A', 'B', 'C', 'D' }
 * // (A cannot be dropped into itself, B, C, or D)
 */
export function getAllDescendantIDs(
  draggedItemIDs: (number | string)[],
  documents: TreeViewDocument[],
): Set<number | string> {
  const invalidTargets = new Set<number | string>()

  // Helper to recursively collect all descendants of a parent
  const collectDescendants = (parentID: number | string) => {
    documents.forEach((doc) => {
      if (doc.value.parentID === parentID) {
        invalidTargets.add(doc.value.id)
        // Recursively collect this child's descendants
        collectDescendants(doc.value.id)
      }
    })
  }

  // For each dragged item, add it and all its descendants to the invalid set
  draggedItemIDs.forEach((id) => {
    // Can't drop on itself
    invalidTargets.add(id)
    // Can't drop on any descendant at any level
    collectDescendants(id)
  })

  return invalidTargets
}
