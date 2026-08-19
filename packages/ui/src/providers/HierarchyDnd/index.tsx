'use client'

import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import React, { createContext, use, useCallback, useId, useMemo, useState } from 'react'

import type { HierarchyDragData, HierarchyDropData } from './types.js'

import { moveDocuments } from '../../elements/Hierarchy/move/moveDocuments.js'
import { useConfig } from '../Config/index.js'
import { useHierarchy } from '../Hierarchy/index.js'
import { useLocale } from '../Locale/index.js'
import { useRouteCache } from '../RouteCache/index.js'
import { useTranslation } from '../Translation/index.js'
import { canDropItems } from './types.js'
import './index.css'

const baseClass = 'hierarchy-dnd'

/**
 * The overlay would otherwise be positioned against the dragged card's own rect, which puts a 40px
 * stack at the top-left corner of a ~216px card - so it only sits under the cursor if you happened to
 * grab that corner. Snapping the stack's centre to the pointer keeps it with the cursor wherever the
 * card was picked up. Purely cosmetic: `pointerWithin` collision is computed from the pointer, not
 * from the overlay.
 */
const OVERLAY_MODIFIERS = [snapCenterToCursor]

/** How many thumbnails the stack shows; the count pill carries the rest. */
const MAX_PREVIEW_CARDS = 3

type HierarchyDndContextValue = {
  /** The drag in flight, or null. Drop targets read this to validate and style themselves. */
  activeDrag: HierarchyDragData | null
  canDrop: (dropTarget: HierarchyDropData) => boolean
}

const Context = createContext<HierarchyDndContextValue>({
  activeDrag: null,
  canDrop: () => false,
})

export const useHierarchyDnd = (): HierarchyDndContextValue => use(Context)

/**
 * Hosts the drag context for moving documents and folders between folders.
 *
 * Mounted high enough to span both the nav and the view - the sidebar tree is a drop target - which
 * is why it is rendered conditionally on the hierarchy view rather than always: it would otherwise
 * wrap the array/blocks drag contexts on document views.
 */
export const HierarchyDndProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeDrag, setActiveDrag] = useState<HierarchyDragData | null>(null)

  /*
   * Without an explicit id, dnd-kit names the `aria-describedby` it puts on every draggable from a
   * module-level counter, which does not line up between the server render and hydration - the
   * card's attribute then mismatches and React discards the whole tree's hydration.
   * See https://github.com/clauderic/dnd-kit/issues/926.
   */
  const dndContextID = useId()

  const {
    config: {
      routes: { api: apiRoute },
    },
  } = useConfig()
  const { code: locale } = useLocale()
  const { i18n, t } = useTranslation()
  const { clearRouteCache } = useRouteCache()
  const { refreshTree } = useHierarchy()

  // A short distance threshold leaves plain clicks (which select) and the marquee intact; a drag
  // only begins once the pointer has actually travelled.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  )

  const canDrop = useCallback(
    (dropTarget: HierarchyDropData): boolean =>
      activeDrag ? canDropItems({ dropTarget, items: activeDrag.items }) : false,
    [activeDrag],
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDrag((event.active.data.current as HierarchyDragData | undefined) ?? null)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const drag = event.active.data.current as HierarchyDragData | undefined
      const drop = event.over?.data.current as HierarchyDropData | undefined

      setActiveDrag(null)

      if (!drag || !drop || drop.type !== 'hierarchy-folder') {
        return
      }

      // Validity is re-derived from the event rather than read off `canDrop`, whose `activeDrag` has
      // just been cleared above.
      if (!canDropItems({ dropTarget: drop, items: drag.items })) {
        return
      }

      const selections: Record<string, { ids: (number | string)[] }> = {}

      for (const item of drag.items) {
        selections[item.collectionSlug] ??= { ids: [] }
        selections[item.collectionSlug].ids.push(item.id)
      }

      void moveDocuments({
        apiRoute,
        destination: { id: drop.folderId, title: drop.title },
        i18n,
        label: drag.items.length === 1 ? drag.items[0].title : t('general:documents'),
        locale,
        parentFieldName: drop.parentFieldName,
        selections,
        t,
      }).then(({ totalMoved }) => {
        if (totalMoved > 0) {
          drag.onMoveSuccess?.()
          refreshTree(drop.hierarchySlug)
          clearRouteCache()
        }
      })
    },
    [apiRoute, clearRouteCache, i18n, locale, refreshTree, t],
  )

  const handleDragCancel = useCallback(() => setActiveDrag(null), [])

  const contextValue = useMemo<HierarchyDndContextValue>(
    () => ({ activeDrag, canDrop }),
    [activeDrag, canDrop],
  )

  const previewCards = activeDrag?.preview.slice(0, MAX_PREVIEW_CARDS) ?? []
  const draggedCount = activeDrag?.items.length ?? 0

  return (
    <Context value={contextValue}>
      <DndContext
        collisionDetection={pointerWithin}
        id={dndContextID}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        sensors={sensors}
      >
        {children}
        <DragOverlay dropAnimation={null} modifiers={OVERLAY_MODIFIERS}>
          {activeDrag ? (
            <div className={`${baseClass}__preview`}>
              {previewCards.map((card, index) => (
                <div
                  className={`${baseClass}__preview-card`}
                  key={index}
                  style={{ '--preview-index': index } as React.CSSProperties}
                >
                  {card}
                </div>
              ))}
              {draggedCount > 1 && (
                <span className={`${baseClass}__preview-count`}>{draggedCount}</span>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </Context>
  )
}
