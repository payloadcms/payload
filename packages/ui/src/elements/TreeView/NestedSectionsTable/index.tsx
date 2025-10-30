'use client'

import { useDndMonitor } from '@dnd-kit/core'
import React from 'react'

import type { ItemKey, NestedSectionsTableProps, SectionItem } from './types.js'

import { Header } from './Header/index.js'
import {
  getItemByPath,
  getItemKeysBetween,
  getNextVisibleItem,
  getPreviousVisibleItem,
} from './navigationUtils.js'
import { NestedItems } from './NestedItems/index.js'
import './index.scss'

const baseClass = 'nested-sections-table'
const DEFAULT_SEGMENT_WIDTH = 30

export const NestedSectionsTable: React.FC<NestedSectionsTableProps> = ({
  className = '',
  columns = [{ name: 'name', label: 'Name' }],
  dropContextName,
  loadingItemKeys,
  onDrop,
  // onEnter,
  onEscape,
  onItemSelection,
  onSelectAll,
  openItemKeys,
  rootItems,
  segmentWidth = DEFAULT_SEGMENT_WIDTH,
  selectedItemKeys,
  toggleItemExpand,
  updateSelections,
}) => {
  const [focusedItemKey, setFocusedItemKey] = React.useState<ItemKey | null>(null)
  const [selectionAnchorItemKey, setSelectionAnchorItemKey] = React.useState<ItemKey | null>(null)
  const [firstCellXOffset, setFirstCellXOffset] = React.useState(0)
  const [firstCellWidth, setFirstCellWidth] = React.useState(0)
  const firstCellRef = React.useRef<HTMLDivElement>(null)

  const getIndexFromItemKey = React.useCallback(
    (itemKey: ItemKey | null): number => {
      if (itemKey === null) {
        return -1
      }

      let currentIndex = 0
      const findIndex = ({
        items,
        targetItemKey,
      }: {
        items: SectionItem[]
        targetItemKey: ItemKey | null
      }): number => {
        for (const item of items) {
          if (item.itemKey === targetItemKey) {
            return currentIndex
          }
          currentIndex++
          if (item.rows && openItemKeys?.has(item.itemKey)) {
            const found = findIndex({ items: item.rows, targetItemKey })
            if (found !== -1) {
              return found
            }
          }
        }
        return -1
      }

      return rootItems ? findIndex({ items: rootItems, targetItemKey: itemKey }) : -1
    },
    [rootItems, openItemKeys],
  )

  // Get the current focused row index for passing down to Row components
  const focusedRowIndex = React.useMemo(
    () => getIndexFromItemKey(focusedItemKey),
    [focusedItemKey, getIndexFromItemKey],
  )

  const onItemClick = React.useCallback(
    ({
      itemKey,
      options,
    }: {
      itemKey: `${string}-${number | string}`
      options: {
        ctrlKey: boolean
        metaKey: boolean
        shiftKey: boolean
      }
    }) => {
      const { shiftKey } = options

      if (shiftKey) {
        // Shift selection: select range from anchor to current item
        // Set anchor if not set
        const anchorItemKey = selectionAnchorItemKey || itemKey
        if (!selectionAnchorItemKey) {
          setSelectionAnchorItemKey(anchorItemKey)
        }

        const itemKeysInRange = getItemKeysBetween({
          itemKeyA: itemKey,
          itemKeyB: anchorItemKey,
          openItemKeys,
          rootItems,
        })

        updateSelections({ itemKeys: itemKeysInRange })
      } else {
        // Normal selection: toggle single item
        // Reset anchor for next shift selection
        setSelectionAnchorItemKey(itemKey)
        setFocusedItemKey(itemKey)
        updateSelections({ itemKeys: selectedItemKeys.has(itemKey) ? [] : [itemKey] })
      }
    },
    [selectionAnchorItemKey, rootItems, openItemKeys, updateSelections, selectedItemKeys],
  )

  // Handle keyboard navigation
  const onItemKeyDown = React.useCallback(
    ({
      event,
      indexPath,
      item,
    }: {
      event: React.KeyboardEvent
      indexPath: number[]
      item: SectionItem
    }) => {
      const { code, ctrlKey, metaKey, shiftKey: isShiftPressed } = event
      const isCtrlPressed = ctrlKey || metaKey

      switch (code) {
        case 'ArrowDown':
        case 'ArrowUp': {
          event.preventDefault()

          const nextItem =
            code === 'ArrowDown'
              ? getNextVisibleItem({ indexPath, openItemKeys, rootItems })
              : getPreviousVisibleItem({ indexPath, openItemKeys, rootItems })

          if (nextItem) {
            setFocusedItemKey(nextItem.itemKey)

            // Handle selection with shift key (incremental selection)
            if (isShiftPressed) {
              if (!selectionAnchorItemKey) {
                setSelectionAnchorItemKey(nextItem.itemKey)
              }

              // Check if next item is already selected
              const isTargetSelected = selectedItemKeys.has(nextItem.itemKey)
              const newSelections = new Set(selectedItemKeys)

              if (isTargetSelected) {
                // Remove from selection (contracting)
                newSelections.delete(item.itemKey)
              } else {
                if (!selectedItemKeys.has(item.itemKey)) {
                  newSelections.add(item.itemKey)
                }
                newSelections.add(nextItem.itemKey)
              }

              updateSelections({ itemKeys: newSelections })
            } else {
              setSelectionAnchorItemKey(nextItem.itemKey)
            }
          }
          break
        }

        case 'ArrowLeft':
        case 'ArrowRight': {
          // Handle expand/collapse for rows with children
          if (item.rows?.length || item.hasChildren) {
            event.preventDefault()
            toggleItemExpand(item.itemKey)
          }
          break
        }

        // case 'Enter': {
        //   event.preventDefault()
        //   onEnter?.(item)
        //   break
        // }

        case 'Escape': {
          event.preventDefault()
          setFocusedItemKey(null)
          setHoveredItemKey(null)
          setSelectionAnchorItemKey(null)
          onEscape()
          break
        }

        case 'KeyA': {
          if (isCtrlPressed) {
            event.preventDefault()
            onSelectAll()
          }
          break
        }

        case 'Space': {
          event.preventDefault()
          const newSelections = new Set(selectedItemKeys)

          if (selectedItemKeys.has(item.itemKey)) {
            newSelections.delete(item.itemKey)
          } else {
            newSelections.add(item.itemKey)
          }

          updateSelections({ itemKeys: newSelections })
          break
        }
      }
    },
    [
      onEscape,
      onSelectAll,
      openItemKeys,
      rootItems,
      selectedItemKeys,
      selectionAnchorItemKey,
      toggleItemExpand,
      updateSelections,
    ],
  )

  const onItemDrag = React.useCallback(
    ({ event, item: dragItem }: { event: PointerEvent; item: null | SectionItem }) => {
      if (!dragItem) {
        return
      }

      const isCurrentlySelected = selectedItemKeys.has(dragItem.itemKey)

      if (!isCurrentlySelected) {
        onItemSelection({
          eventOptions: {
            ctrlKey: event.ctrlKey || event.metaKey,
            metaKey: event.ctrlKey || event.metaKey,
            shiftKey: event.shiftKey,
          },
          itemKey: dragItem.itemKey,
        })
      }
    },
    [selectedItemKeys, onItemSelection],
  )

  const [isDragging, setIsDragging] = React.useState(false)
  const [hoveredItemKey, setHoveredItemKey] = React.useState<ItemKey | null>(null)
  const [targetParentItemKey, setTargetParentItemKey] = React.useState<ItemKey | null>(null)

  const onDroppableHover = React.useCallback(
    ({
      hoveredItemKey: newHoveredItemKey,
      targetItem,
    }: {
      hoveredItemKey?: ItemKey
      targetItem: null | SectionItem
    }) => {
      setHoveredItemKey(newHoveredItemKey || null)
      setTargetParentItemKey(targetItem?.itemKey || null)
    },
    [],
  )

  useDndMonitor({
    onDragCancel() {
      setIsDragging(false)
      setHoveredItemKey(null)
      setTargetParentItemKey(null)

      document.body.style.cursor = ''
    },
    onDragEnd(event) {
      setIsDragging(false)
      setHoveredItemKey(null)
      setTargetParentItemKey(null)
      document.body.style.cursor = ''
      if (!event.over) {
        return
      }

      if (
        event.over.data.current.type === 'tree-view-table' &&
        'targetItem' in event.over.data.current
      ) {
        void onDrop({ targetItemKey: event.over.data.current.targetItem?.itemKey })
      }
    },
    onDragStart() {
      setIsDragging(true)
      document.body.style.cursor = 'grabbing'
    },
  })

  React.useEffect(() => {
    if (isDragging && firstCellRef.current) {
      const rect = firstCellRef.current.getBoundingClientRect()
      setFirstCellWidth(Math.round(rect.width))
      setFirstCellXOffset(Math.round(rect.left))
    }
  }, [isDragging])

  return (
    <div
      className={[`${baseClass}__wrapper`, isDragging && `${baseClass}--dragging`, className]
        .filter(Boolean)
        .join(' ')}
      onBlur={(e) => {
        // Check if focus is leaving the table completely (not just moving between children)
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setFocusedItemKey(null)
        }
      }}
      onFocus={(e) => {
        // Check if focus is entering the table from outside (not from a child)
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          // Focus the first selected item, or the first item if nothing is selected
          if (selectedItemKeys && selectedItemKeys.size > 0) {
            setFocusedItemKey(Array.from(selectedItemKeys)[0])
          } else if (focusedItemKey === null && rootItems && rootItems.length > 0) {
            setFocusedItemKey(rootItems[0].itemKey)
          }
        }
      }}
      role="table"
      tabIndex={-1}
    >
      <div className={baseClass}>
        <Header columns={columns} />

        <NestedItems
          columns={columns}
          dropContextName={dropContextName}
          firstCellRef={firstCellRef}
          firstCellWidth={firstCellWidth}
          firstCellXOffset={firstCellXOffset}
          focusedItemKey={focusedItemKey}
          hoveredItemKey={hoveredItemKey}
          isDragging={isDragging}
          items={rootItems}
          loadingItemKeys={loadingItemKeys}
          onDroppableHover={onDroppableHover}
          onFocusChange={(indexPath: number[]) => {
            // Convert index back to row ID
            const row = getItemByPath({
              indexPath,
              rootItems,
            })
            if (row) {
              setFocusedItemKey(row.itemKey)
            }
          }}
          onItemClick={onItemClick}
          onItemDrag={onItemDrag}
          onItemKeyDown={onItemKeyDown}
          openItemKeys={openItemKeys}
          parentIndex={0}
          parentIndexPath={[]}
          parentItems={[]}
          segmentWidth={segmentWidth}
          selectedItemKeys={selectedItemKeys}
          targetParentItemKey={targetParentItemKey}
          toggleItemExpand={toggleItemExpand}
        />
      </div>
    </div>
  )
}
