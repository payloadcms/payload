'use client'

import { useDndMonitor } from '@dnd-kit/core'
import React from 'react'

import type { ItemKey, NestedSectionsTableProps, SectionItem } from './types.js'

import { Header } from './Header/index.js'
import { NestedItems } from './NestedItems/index.js'
import './index.scss'

const baseClass = 'nested-sections-table'
const DEFAULT_SEGMENT_WIDTH = 30

export const NestedSectionsTable: React.FC<NestedSectionsTableProps> = ({
  canFocusItem,
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

  const totalVisibleItems = React.useMemo(() => {
    if (!rootItems) {
      return 0
    }

    const countVisibleItems = (items: SectionItem[]): number => {
      let count = 0
      for (const item of items) {
        count++
        if (item.rows && openItemKeys?.has(item.itemKey)) {
          count += countVisibleItems(item.rows)
        }
      }
      return count
    }

    return countVisibleItems(rootItems)
  }, [rootItems, openItemKeys])

  // Get row at a specific visible index
  const getItemFromIndex = React.useCallback(
    (targetIndex: number): SectionItem | undefined => {
      if (!rootItems) {
        return undefined
      }

      const findItemAtIndex = ({
        currentIndex,
        items,
        targetIndex,
      }: {
        currentIndex: number
        items: SectionItem[]
        targetIndex: number
      }): SectionItem | undefined => {
        for (const item of items) {
          if (currentIndex === targetIndex) {
            return item
          }
          currentIndex++
          if (item.rows && openItemKeys?.has(item.itemKey)) {
            const found = findItemAtIndex({ currentIndex, items: item.rows, targetIndex })
            if (found) {
              return found
            }
          }
        }
        return undefined
      }

      return findItemAtIndex({ currentIndex: 0, items: rootItems, targetIndex })
    },
    [rootItems, openItemKeys],
  )

  // Get visual index from row ID
  const getIndexFromItemKey = React.useCallback(
    (itemKey: ItemKey | null): number => {
      if (itemKey === null) {
        return -1
      }

      const findIndex = ({
        currentIndex,
        items,
        targetItemKey,
      }: {
        currentIndex: number
        items: SectionItem[]
        targetItemKey: ItemKey | null
      }): number => {
        for (const item of items) {
          if (item.itemKey === targetItemKey) {
            return currentIndex
          }
          currentIndex++
          if (item.rows && openItemKeys?.has(item.itemKey)) {
            const found = findIndex({ currentIndex, items: item.rows, targetItemKey })
            if (found !== -1) {
              return found
            }
          }
        }
        return -1
      }

      return rootItems
        ? findIndex({ currentIndex: 0, items: rootItems, targetItemKey: itemKey })
        : -1
    },
    [rootItems, openItemKeys],
  )

  // Get the current focused row index for passing down to Row components
  const focusedRowIndex = React.useMemo(
    () => getIndexFromItemKey(focusedItemKey),
    [focusedItemKey, getIndexFromItemKey],
  )

  const onSelectionChange = React.useCallback(
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
        if (selectionAnchorItemKey === null) {
          setSelectionAnchorItemKey(itemKey)
          // Just select this item as the starting point
          updateSelections({ itemKeys: [itemKey] })
          return
        }

        // Find indexes for anchor and current item
        const anchorIndex = getIndexFromItemKey(selectionAnchorItemKey)
        const currentIndex = getIndexFromItemKey(itemKey)

        if (anchorIndex === -1 || currentIndex === -1) {
          // Fallback to simple selection if indexes not found
          updateSelections({ itemKeys: [itemKey] })
          return
        }

        // Collect all focusable items in the range
        const startIndex = Math.min(anchorIndex, currentIndex)
        const endIndex = Math.max(anchorIndex, currentIndex)
        const rangeItemKeys: Array<`${string}-${number | string}`> = []

        for (let i = startIndex; i <= endIndex; i++) {
          const item = getItemFromIndex(i)
          if (item && canFocusItem(item)) {
            rangeItemKeys.push(item.itemKey)
          }
        }

        updateSelections({ itemKeys: rangeItemKeys })
      } else {
        // Normal selection: toggle single item
        // Reset anchor for next shift selection
        setSelectionAnchorItemKey(itemKey)

        const isCurrentlySelected = selectedItemKeys.has(itemKey)
        if (isCurrentlySelected) {
          const newItemKeys = new Set(selectedItemKeys)
          newItemKeys.delete(itemKey)
          updateSelections({ itemKeys: newItemKeys })
        } else {
          updateSelections({ itemKeys: [itemKey] })
        }
      }
    },
    [
      updateSelections,
      selectedItemKeys,
      selectionAnchorItemKey,
      getIndexFromItemKey,
      getItemFromIndex,
      canFocusItem,
    ],
  )

  // Handle keyboard navigation
  const handleRowKeyPress = React.useCallback(
    ({ event, item }: { event: React.KeyboardEvent; item: SectionItem }) => {
      const { code, ctrlKey, metaKey, shiftKey } = event
      const isCtrlPressed = ctrlKey || metaKey

      switch (code) {
        case 'ArrowDown':
        case 'ArrowUp': {
          event.preventDefault()

          const direction: -1 | 1 = code === 'ArrowUp' ? -1 : 1
          const currentIndex = getIndexFromItemKey(item.itemKey)
          let nextIndex = currentIndex + direction

          // Find next focusable row
          while (nextIndex >= 0 && nextIndex < totalVisibleItems) {
            const nextItem = getItemFromIndex(nextIndex)
            if (nextItem && canFocusItem(nextItem)) {
              setFocusedItemKey(nextItem.itemKey)

              // Handle shift+arrow for range selection
              if (shiftKey) {
                // Pass the selection event with shiftKey to the next row
                // The parent's selection logic should handle range selection
                onSelectionChange({
                  itemKey: nextItem.itemKey,
                  options: { ctrlKey, metaKey, shiftKey },
                })
              }

              break
            }
            nextIndex += direction
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
          onSelectionChange({
            itemKey: item.itemKey,
            options: { ctrlKey, metaKey, shiftKey },
          })
          break
        }
      }
    },
    [
      getIndexFromItemKey,
      totalVisibleItems,
      getItemFromIndex,
      canFocusItem,
      // onEnter,
      onEscape,
      onSelectAll,
      toggleItemExpand,
      onSelectionChange,
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
      // eslint-disable-next-line react-compiler/react-compiler
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
          focusedItemIndex={focusedRowIndex}
          hoveredItemKey={hoveredItemKey}
          isDragging={isDragging}
          items={rootItems}
          loadingItemKeys={loadingItemKeys}
          onDroppableHover={onDroppableHover}
          onFocusChange={(index) => {
            // Convert index back to row ID
            const row = getItemFromIndex(index)
            if (row) {
              setFocusedItemKey(row.itemKey)
            }
          }}
          onItemDrag={onItemDrag}
          onItemKeyPress={handleRowKeyPress}
          onSelectionChange={onSelectionChange}
          openItemKeys={openItemKeys}
          parentIndex={0}
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
