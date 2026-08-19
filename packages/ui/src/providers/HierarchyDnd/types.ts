import type React from 'react'

export type HierarchyDragItem = {
  collectionSlug: string
  id: number | string
  title: string
}

/**
 * Attached to every draggable card. Rides on dnd-kit's `active.data`, which is how the drag context
 * - mounted above the view - gets at state that only exists below it: the current selection's
 * contents, its card renders, and how to clear it afterwards.
 */
export type HierarchyDragData = {
  items: HierarchyDragItem[]
  /**
   * Called after a successful move, by the surface that started the drag. The selection provider
   * lives below the drag context, so the context can't clear the selection itself.
   */
  onMoveSuccess?: () => void
  /**
   * Ghosted card renders shown fanned under the cursor. Only the first few are used; the rest of
   * the count collapses into a "+N" badge.
   */
  preview: React.ReactNode[]
  type: 'hierarchy-items'
}

/**
 * Attached to every drop target - folder cards, tree nodes, breadcrumbs.
 */
export type HierarchyDropData = {
  /**
   * Collection slugs this destination accepts. Undefined or empty means unrestricted.
   */
  allowedCollections?: string[]
  /**
   * Ids of the destination's ancestors, so a folder can't be dropped into its own subtree.
   */
  ancestorIds: (number | string)[]
  /** Destination hierarchy item, or null for root. */
  folderId: null | number | string
  hierarchySlug: string
  parentFieldName: string
  title: string
  type: 'hierarchy-folder'
}

/**
 * Whether `dropTarget` can accept `items`: the destination has to accept every dragged collection,
 * and a folder can never land inside itself or its own descendants.
 *
 * Shared by the live `canDrop` (which styles hover states) and the drop handler (which re-derives
 * validity from the event, because the active drag has already been cleared by then).
 */
export const canDropItems = ({
  dropTarget,
  items,
}: {
  dropTarget: HierarchyDropData
  items: HierarchyDragItem[]
}): boolean =>
  items.every((item) => {
    if (
      dropTarget.allowedCollections?.length &&
      !dropTarget.allowedCollections.includes(item.collectionSlug)
    ) {
      return false
    }

    if (item.collectionSlug === dropTarget.hierarchySlug) {
      // Ids are compared as strings because a folder id can arrive as either across the
      // config/query/DOM boundaries.
      return (
        String(item.id) !== String(dropTarget.folderId) &&
        !dropTarget.ancestorIds.some((id) => String(id) === String(item.id))
      )
    }

    return true
  })
