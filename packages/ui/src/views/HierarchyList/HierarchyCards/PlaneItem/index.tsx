'use client'

import type { User } from 'payload'

import { useDraggable, useDroppable } from '@dnd-kit/core'
import React, { useMemo } from 'react'

import type {
  HierarchyDragData,
  HierarchyDropData,
} from '../../../../providers/HierarchyDnd/types.js'
import type { TableRow } from '../../HierarchyTable/types.js'

import { useHierarchyDnd } from '../../../../providers/HierarchyDnd/index.js'
import { DragPreviewItem } from '../DragPreviewItem/index.js'
import { HierarchyCard } from '../HierarchyCard/index.js'

export type PlaneItemProps = {
  /**
   * Ids of the folders between the root and the folder currently open, so a folder can't be dropped
   * into its own subtree.
   */
  ancestorIds: (number | string)[]
  baseClass: string
  /** Flat index across every band, which is the space selection gestures operate in. */
  flatIndex: number
  hierarchySlug: string
  href: string
  isHierarchyGroup: boolean
  isSelected: boolean
  lockedUser?: User
  onClickCapture: (event: React.MouseEvent, flatIndex: number) => void
  onDoubleClick: (event: React.MouseEvent, href: string) => void
  onKeyDown: (event: React.KeyboardEvent, flatIndex: number) => void
  /**
   * Called on pointer-down over an unselected card, so dragging one collapses the selection onto it
   * before the drag payload is read - the way a file browser behaves.
   */
  onPointerDownUnselected: (flatIndex: number) => void
  parentFieldName: string
  /**
   * Hands the card element to the plane, which hit-tests it during marquee selection.
   */
  registerNode: (flatIndex: number, node: HTMLElement | null) => void
  row: TableRow
  /**
   * Payload for dragging the whole current selection. Shared by every selected card, so it is built
   * once per render rather than per card.
   */
  selectionDragData: HierarchyDragData
  showTypePill: boolean
  title: string
}

/**
 * One card in the plane: a drag source always, and a drop target when it is a folder.
 *
 * Exists as its own component because `useDraggable`/`useDroppable` are hooks and so cannot be
 * called inside the plane's row loop.
 */
export const PlaneItem: React.FC<PlaneItemProps> = ({
  ancestorIds,
  baseClass,
  flatIndex,
  hierarchySlug,
  href,
  isHierarchyGroup,
  isSelected,
  lockedUser,
  onClickCapture,
  onDoubleClick,
  onKeyDown,
  onPointerDownUnselected,
  parentFieldName,
  registerNode,
  row,
  selectionDragData,
  showTypePill,
  title,
}) => {
  const { activeDrag, canDrop } = useHierarchyDnd()

  const rowDragData = useMemo<HierarchyDragData>(
    () => ({
      type: 'hierarchy-items',
      items: [{ id: row.id, collectionSlug: row._collectionSlug, title }],
      onMoveSuccess: selectionDragData.onMoveSuccess,
      preview: [<DragPreviewItem isHierarchyGroup={isHierarchyGroup} key="preview" row={row} />],
    }),
    [isHierarchyGroup, row, selectionDragData.onMoveSuccess, title],
  )

  // Dragging a card that is part of the selection moves the whole selection; dragging an unselected
  // one moves just it.
  const dragData = isSelected ? selectionDragData : rowDragData

  const dropData = useMemo<HierarchyDropData | undefined>(
    () =>
      isHierarchyGroup
        ? {
            type: 'hierarchy-folder',
            allowedCollections: row._allowedCollections as string[] | undefined,
            ancestorIds,
            folderId: row.id,
            hierarchySlug,
            parentFieldName,
            title,
          }
        : undefined,
    [ancestorIds, hierarchySlug, isHierarchyGroup, parentFieldName, row, title],
  )

  const rowKey = `${row._collectionSlug}-${row.id}`

  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef: setDragRef,
  } = useDraggable({
    id: `hierarchy-card-${rowKey}`,
    data: dragData,
    disabled: Boolean(lockedUser),
  })

  const { isOver, setNodeRef: setDropRef } = useDroppable({
    id: `hierarchy-card-drop-${rowKey}`,
    data: dropData,
    disabled: !dropData,
  })

  const dropState = isOver && dropData ? (canDrop(dropData) ? 'over' : 'invalid') : undefined

  // A folder is both a drag source and a drop target, and the plane needs the same node for marquee
  // hit-testing, so one callback fans it out to all three.
  const setNodeRef = (node: HTMLElement | null) => {
    setDragRef(node)
    setDropRef(node)
    registerNode(flatIndex, node)
  }

  // Dragged cards stay in place but read as lifted, matching the drag overlay following the cursor.
  const isBeingDragged =
    isDragging || (Boolean(activeDrag) && isSelected && activeDrag === selectionDragData)

  /*
   * dnd-kit's sensors activate through listeners named exactly `onPointerDown` and `onKeyDown`, which
   * are also the events this card needs for selection. Spreading `listeners` and then declaring
   * either prop would silently overwrite the activator and no drag would ever start, so the two are
   * composed by hand and the rest of the listeners spread as-is.
   */
  const {
    onKeyDown: onDragKeyDown,
    onPointerDown: onDragPointerDown,
    ...remainingListeners
  } = listeners ?? {}

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- the card's own link remains the keyboard-operable control; these handlers only layer pointer selection and drag gestures on top of it
    <li
      {...attributes}
      {...remainingListeners}
      className={[`${baseClass}__item`, isBeingDragged && `${baseClass}__item--dragging`]
        .filter(Boolean)
        .join(' ')}
      onClickCapture={(event) => onClickCapture(event, flatIndex)}
      onDoubleClick={(event) => onDoubleClick(event, href)}
      onKeyDown={(event) => {
        onDragKeyDown?.(event)
        onKeyDown(event, flatIndex)
      }}
      onPointerDown={(event) => {
        // The sensor goes first so it sees the untouched event; the selection collapse that follows
        // only schedules React state, which the sensor never reads.
        onDragPointerDown?.(event)

        if (!isSelected) {
          onPointerDownUnselected(flatIndex)
        }
      }}
      ref={setNodeRef}
    >
      <HierarchyCard
        dropState={dropState}
        href={href}
        isHierarchyGroup={isHierarchyGroup}
        isSelected={isSelected}
        lockedUser={lockedUser}
        row={row}
        showTypePill={showTypePill}
        title={title}
      />
    </li>
  )
}
