'use client'

import type { DragEndEvent } from '@dnd-kit/core'

import { useDndMonitor } from '@dnd-kit/core'
import React from 'react'
import { toast } from 'sonner'

import type { SectionRow } from '../NestedSectionsTable/types.js'

import { useTranslation } from '../../../providers/Translation/index.js'
import { useTreeView } from '../../../providers/TreeView/index.js'
import { NestedSectionsTable } from '../NestedSectionsTable/index.js'
import { SeedDataButton } from '../SeedDataButton/index.js'
import { getAllDescendantIDs } from '../utils/getAllDescendantIDs.js'
import { itemsToSectionRows } from '../utils/itemsToSectionRows.js'
import './index.scss'

const baseClass = 'tree-view-results-table'
const dropContextName = 'tree-view-table'

export function TreeViewTable() {
  const {
    clearSelections,
    collectionSlug,
    getSelectedItems,
    items,
    loadingRowIDs,
    moveItems,
    onItemSelection,
    openItemIDs,
    selectAll,
    selectedItemKeys,
    toggleRow,
    updateSelections,
  } = useTreeView()
  const { i18n, t } = useTranslation()

  // UI-only drag state
  const [isDragging, setIsDragging] = React.useState(false)
  const [hoveredRowID, setHoveredRowID] = React.useState<null | number | string>(null)
  const [targetParentID, setTargetParentID] = React.useState<null | number | string>(null)

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
        const invalidTargets = new Set<number | string>()
        docIDs.forEach((id) => {
          const descendants = getAllDescendantIDs({ itemIDs: [id], items })
          descendants.forEach((descendantID) => invalidTargets.add(descendantID))
        })
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
      // eslint-disable-next-line react-compiler/react-compiler
      document.body.style.cursor = ''
    },
    onDragEnd(event) {
      setIsDragging(false)
      setHoveredRowID(null)
      setTargetParentID(null)
      document.body.style.cursor = ''
      void onDragEnd(event)
    },
    onDragStart() {
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

      const isCurrentlySelected = selectedItemKeys.has(dragItemDoc.itemKey)

      if (!isCurrentlySelected) {
        const index = items.findIndex((d) => d.itemKey === dragItemDoc.itemKey)
        onItemSelection({
          eventOptions: {
            ctrlKey: event.ctrlKey || event.metaKey,
            metaKey: event.ctrlKey || event.metaKey,
            shiftKey: event.shiftKey,
          },
          item: dragItemDoc,
        })
      }
    },
    [items, selectedItemKeys, onItemSelection],
  )

  const unfocusableIDs = React.useMemo(() => {
    return getAllDescendantIDs({ itemIDs: selectedRowIDs, items })
  }, [selectedRowIDs, items])

  const isRowFocusable = React.useCallback(
    (row: SectionRow) => {
      return !unfocusableIDs.has(row.rowID)
    },
    [unfocusableIDs],
  )

  const handleSelectAll = React.useCallback(() => {
    selectAll()
  }, [selectAll])

  const handleEnter = React.useCallback(
    (row: SectionRow) => {
      if (selectedItemKeys.size === 1) {
        // TODO: Navigate to the selected item
      }
    },
    [selectedItemKeys],
  )

  return (
    <>
      {/* TODO: remove this button */}
      <SeedDataButton collectionSlug={collectionSlug} />
      <NestedSectionsTable
        className={baseClass}
        dropContextName={dropContextName}
        hoveredRowID={hoveredRowID}
        isDragging={isDragging}
        isRowFocusable={isRowFocusable}
        loadingRowIDs={loadingRowIDs}
        onDroppableHover={onDroppableHover}
        onEnter={handleEnter}
        onEscape={clearSelections}
        onRowDrag={onRowDrag}
        onSelectAll={handleSelectAll}
        openItemIDs={openItemIDs}
        sections={sections}
        selectedItemKeys={selectedItemKeys}
        targetParentID={targetParentID}
        toggleRowExpand={toggleRow}
        updateSelections={updateSelections}
      />
    </>
  )
}
