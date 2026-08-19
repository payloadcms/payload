'use client'

import { useDroppable } from '@dnd-kit/core'
import React from 'react'

import type { HierarchyDropData } from '../../../providers/HierarchyDnd/types.js'

import { useHierarchyDnd } from '../../../providers/HierarchyDnd/index.js'
import './index.css'

const baseClass = 'step-nav-drop-target'

/**
 * Makes one breadcrumb a hierarchy drop target, which is how documents get moved *out* of a folder:
 * the trail's root crumb moves them to root and an ancestor crumb moves them up.
 *
 * A component rather than an inline hook because `useDroppable` can't be called inside the trail's
 * render loop. Only rendered for items that carry a `dropTarget`, which in practice means only on the
 * hierarchy view - so it is always inside the drag context.
 */
export const StepNavDropTarget: React.FC<{
  children: React.ReactNode
  dropTarget: HierarchyDropData
}> = ({ children, dropTarget }) => {
  const { canDrop } = useHierarchyDnd()

  const { isOver, setNodeRef } = useDroppable({
    id: `step-nav-drop-${dropTarget.hierarchySlug}-${dropTarget.folderId ?? 'root'}`,
    data: dropTarget,
  })

  const dropState = isOver ? (canDrop(dropTarget) ? 'over' : 'invalid') : undefined

  return (
    <span
      className={[baseClass, dropState && `${baseClass}--drop-${dropState}`]
        .filter(Boolean)
        .join(' ')}
      ref={setNodeRef}
    >
      {children}
    </span>
  )
}
