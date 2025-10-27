'use client'

import type { DragEndEvent } from '@dnd-kit/core'
import type { TreeViewItem } from 'payload/shared'

import { useDndMonitor } from '@dnd-kit/core'
import React from 'react'
import { toast } from 'sonner'

import type { SectionRow } from '../NestedSectionsTable/index.js'

import { useTranslation } from '../../../providers/Translation/index.js'
import { useTreeView } from '../../../providers/TreeView/index.js'
import { NestedSectionsTable } from '../NestedSectionsTable/index.js'
import { SeedDataButton } from '../SeedDataButton/index.js'
import { itemsToSectionRows } from '../utils/documentsToSectionRows.js'
import { getAllDescendantIDs } from '../utils/getAllDescendantIDs.js'
import './index.scss'

const baseClass = 'tree-view-results-table'
const dropContextName = 'tree-view-table'

export function TreeViewTable() {
  const {
    clearSelections,
    collectionSlug,
    focusedRowIndex,
    getSelectedItems,
    items,
    loadingRowIDs,
    moveItems,
    onItemClick,
    openItemIDs,
    selectedItemKeys,
    setFocusedRowIndex,
    toggleRow,
  } = useTreeView()
  const { i18n, t } = useTranslation()

  // Local drag state
  const [isDragging, setIsDragging] = React.useState(false)
  const [hoveredRowID, setHoveredRowID] = React.useState<null | number | string>(null)
  const [targetParentID, setTargetParentID] = React.useState<null | number | string>(null)

  // Compute drag overlay item from selected items
  const dragOverlayItem = React.useMemo(() => {
    if (!isDragging || selectedItemKeys.size === 0) {
      return undefined
    }
    // Use the first selected item as the drag overlay
    const firstKey = Array.from(selectedItemKeys)[0]
    return items.find((d) => d.itemKey === firstKey)
  }, [isDragging, selectedItemKeys, items])

  // Handle drag/drop events
  const onDragEnd = React.useCallback(
    async (event: DragEndEvent) => {
      if (!event.over) {
        return
      }

      if (
        event.over.data.current.type === 'tree-view-table' &&
        'targetItem' in event.over.data.current
      ) {
        const selectedItems = getSelectedItems()
        const docIDs = selectedItems.map((doc) => doc.value.id)
        const targetItem = event.over.data.current.targetItem
        const targetID = targetItem?.rowID

        // Validate: prevent moving a parent into its own descendant
        const invalidTargets = getAllDescendantIDs(docIDs, items)
        if (targetID && invalidTargets.has(targetID)) {
          toast.error(t('general:cannotMoveParentIntoChild'))
          return
        }

        try {
          await moveItems({
            docIDs,
            parentID: targetID,
          })
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error moving items:', error)
          toast.error(t('general:errorMovingItems'))
        }
      }
    },
    [moveItems, getSelectedItems, items, t],
  )

  useDndMonitor({
    onDragCancel() {
      setIsDragging(false)
      setHoveredRowID(null)
      setTargetParentID(null)
      // todo: do this differently
      document.body.style.cursor = ''
    },
    onDragEnd(event) {
      setIsDragging(false)
      setHoveredRowID(null)
      setTargetParentID(null)
      document.body.style.cursor = ''
      void onDragEnd(event)
    },
    onDragStart(event) {
      setIsDragging(true)
      document.body.style.cursor = 'grabbing'
    },
  })

  const onDroppableHover = React.useCallback(
    ({
      hoveredRowID: newHoveredRowID,
      targetItem,
    }: {
      hoveredRowID?: number | string
      targetItem: null | SectionRow
    }) => {
      setHoveredRowID(newHoveredRowID || null)
      setTargetParentID(targetItem?.rowID || null)
    },
    [],
  )

  const onRowDrag = React.useCallback(
    ({ event, item: dragItem }: { event: PointerEvent; item: null | SectionRow }) => {
      if (!dragItem) {
        return
      }

      const dragItemDoc = items.find((doc) => doc.value.id === dragItem.rowID)
      if (!dragItemDoc) {
        return
      }

      const isCtrlPressed = event.ctrlKey || event.metaKey
      const isShiftPressed = event.shiftKey
      const isCurrentlySelected = selectedItemKeys.has(dragItemDoc.itemKey)

      if (!isCurrentlySelected) {
        // Select the dragged item (and maintain ctrl/shift selections)
        const indexes: number[] = []
        for (let idx = 0; idx < items.length; idx++) {
          const doc = items[idx]
          if (doc.itemKey === dragItemDoc.itemKey) {
            indexes.push(idx)
          } else if ((isCtrlPressed || isShiftPressed) && selectedItemKeys.has(doc.itemKey)) {
            indexes.push(idx)
          }
        }

        // Update selections through provider's onItemClick
        if (indexes.length > 0) {
          const index = items.findIndex((d) => d.itemKey === dragItemDoc.itemKey)
          // Call onItemClick to update selections in provider
          onItemClick({
            event: {
              ctrlKey: isCtrlPressed,
              metaKey: isCtrlPressed,
              nativeEvent: event,
              shiftKey: isShiftPressed,
            } as any,
            index,
            item: dragItemDoc,
          })
        }
      }
    },
    [items, selectedItemKeys, onItemClick],
  )

  const onRowClick = React.useCallback(
    ({ event, row }: { event: React.MouseEvent<HTMLElement>; row: SectionRow }) => {
      const index = items.findIndex((doc) => doc.value.id === row.rowID)
      if (index !== -1) {
        const item = items[index]
        void onItemClick({ event, index, item })
      }
    },
    [items, onItemClick],
  )

  // Helper to check if an item should be skipped during navigation
  const isItemFocusable = React.useCallback(
    (item: TreeViewItem) => {
      // Check if this item is a descendant of any selected item
      const selectedItems = Array.from(selectedItemKeys).map((key) =>
        items.find((d) => d.itemKey === key),
      )

      for (const selectedItem of selectedItems) {
        if (!selectedItem) {
          continue
        }

        // Check if item is a descendant by walking up the parent chain
        let current = item
        while (current?.value?.parentID !== undefined && current.value.parentID !== null) {
          if (current.value.parentID === selectedItem.value.id) {
            return false // This item is a descendant of a selected item
          }
          // Find the parent item
          const parentItem = items.find((i) => i.value.id === current.value.parentID)
          if (!parentItem) {
            break
          }
          current = parentItem
        }
      }

      return true
    },
    [items, selectedItemKeys],
  )

  // Find next focusable item index, skipping disabled/invalid items
  const findNextFocusableIndex = React.useCallback(
    (currentIndex: number, direction: -1 | 1): number => {
      let nextIndex = currentIndex + direction

      while (nextIndex >= 0 && nextIndex < items.length) {
        const nextItem = items[nextIndex]
        if (isItemFocusable(nextItem)) {
          return nextIndex
        }
        nextIndex += direction
      }

      return currentIndex // No valid item found, stay at current
    },
    [items, isItemFocusable],
  )

  const onRowKeyPress = React.useCallback(
    ({ event, row }: { event: React.KeyboardEvent; row: SectionRow }) => {
      const index = items.findIndex((doc) => doc.value.id === row.rowID)
      if (index === -1) {
        return
      }

      const item = items[index]
      const { code, ctrlKey, metaKey, shiftKey } = event
      const isShiftPressed = shiftKey
      const isCtrlPressed = ctrlKey || metaKey
      const isCurrentlySelected = selectedItemKeys.has(item.itemKey)

      switch (code) {
        case 'ArrowDown':
        case 'ArrowUp': {
          event.preventDefault()

          const direction: -1 | 1 = code === 'ArrowUp' ? -1 : 1
          const newItemIndex = findNextFocusableIndex(index, direction)

          if (newItemIndex === index) {
            return // No valid row to navigate to
          }

          // Just move focus, don't trigger selection
          setFocusedRowIndex(newItemIndex)

          break
        }
        case 'Enter': {
          if (selectedItemKeys.size === 1) {
            setFocusedRowIndex(undefined)
            // TODO: Navigate to the selected item
          }
          break
        }
        case 'Escape': {
          clearSelections()
          break
        }
        case 'KeyA': {
          if (isCtrlPressed) {
            event.preventDefault()
            setFocusedRowIndex(items.length - 1)
            // Select all by clicking on each item
            items.forEach((doc, idx) => {
              onItemClick({
                event: {
                  ctrlKey: true,
                  metaKey: true,
                  nativeEvent: {},
                  shiftKey: false,
                } as any,
                index: idx,
                item: doc,
              })
            })
          }
          break
        }
        case 'Space': {
          event.preventDefault()
          onItemClick({
            event: {
              ctrlKey: true,
              metaKey: true,
              nativeEvent: {},
              shiftKey: false,
            } as any,
            index,
            item,
          })
          break
        }
      }
    },
    [
      items,
      selectedItemKeys,
      onItemClick,
      setFocusedRowIndex,
      clearSelections,
      findNextFocusableIndex,
    ],
  )

  const [columns] = React.useState(() => [
    {
      name: 'name',
      label: t('general:name'),
    },
    {
      name: 'updatedAt',
      label: t('general:updatedAt'),
    },
  ])

  const sections = React.useMemo(
    () => itemsToSectionRows({ i18nLanguage: i18n.language, items }),
    [items, i18n.language],
  )

  const selectedRowIDs = React.useMemo(() => {
    return Array.from(selectedItemKeys).map((key) => {
      const doc = items.find((d) => d.itemKey === key)
      return doc?.value.id || ''
    })
  }, [selectedItemKeys, items])

  return (
    <>
      {/* TODO: remove this button */}
      <SeedDataButton collectionSlug={collectionSlug} />
      <NestedSectionsTable
        className={baseClass}
        dropContextName={dropContextName}
        focusedRowIndex={focusedRowIndex}
        hoveredRowID={hoveredRowID}
        isDragging={isDragging}
        loadingRowIDs={loadingRowIDs}
        onDroppableHover={onDroppableHover}
        onFocusChange={setFocusedRowIndex}
        onRowClick={onRowClick}
        onRowDrag={onRowDrag}
        onRowKeyPress={onRowKeyPress}
        openItemIDs={openItemIDs}
        sections={sections}
        selectedRowIDs={selectedRowIDs}
        targetParentID={targetParentID}
        toggleRow={toggleRow}
        // columns={columns}
      />
      {/* {selectedItemKeys.size > 0 && dragOverlayItem && (
        <TreeViewDragOverlay item={dragOverlayItem} selectedCount={selectedItemKeys.size} />
      )} */}
    </>
  )
}
