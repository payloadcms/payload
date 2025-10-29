'use client'

import { useDndMonitor } from '@dnd-kit/core'
import React from 'react'

import type { ItemKey, NestedSectionsTableProps, SectionRow } from './types.js'

import { Header } from './Header/index.js'
import { TableSection } from './TableSection/index.js'
import './index.scss'

const baseClass = 'nested-sections-table'
const DEFAULT_SEGMENT_WIDTH = 30

export const NestedSectionsTable: React.FC<NestedSectionsTableProps> = ({
  className = '',
  columns = [{ name: 'name', label: 'Name' }],
  dropContextName,
  isRowFocusable,
  loadingRowItemKeys,
  onDrop,
  // onEnter,
  onEscape,
  onItemSelection,
  onSelectAll,
  openItemKeys,
  sections,
  segmentWidth = DEFAULT_SEGMENT_WIDTH,
  selectedItemKeys,
  toggleRowExpand,
  updateSelections,
}) => {
  const [focusedRowID, setFocusedRowID] = React.useState<null | number | string>(null)
  const [selectionAnchorID, setSelectionAnchorID] = React.useState<null | number | string>(null)
  const [firstCellXOffset, setFirstCellXOffset] = React.useState(0)
  const [firstCellWidth, setFirstCellWidth] = React.useState(0)
  const firstCellRef = React.useRef<HTMLDivElement>(null)

  const totalVisibleRows = React.useMemo(() => {
    if (!sections) {
      return 0
    }

    const countVisibleRows = (rows: SectionRow[]): number => {
      let count = 0
      for (const row of rows) {
        count++
        if (row.rows && openItemKeys?.has(row.rowID)) {
          count += countVisibleRows(row.rows)
        }
      }
      return count
    }

    return countVisibleRows(sections)
  }, [sections, openItemKeys])

  // Get row at a specific visible index
  const getRowAtVisibleIndex = React.useCallback(
    (targetIndex: number): SectionRow | undefined => {
      if (!sections) {
        return undefined
      }

      let currentIndex = 0
      const findRow = (rows: SectionRow[]): SectionRow | undefined => {
        for (const row of rows) {
          if (currentIndex === targetIndex) {
            return row
          }
          currentIndex++
          if (row.rows && openItemKeys?.has(row.rowID)) {
            const found = findRow(row.rows)
            if (found) {
              return found
            }
          }
        }
        return undefined
      }

      return findRow(sections)
    },
    [sections, openItemKeys],
  )

  // Get visual index from row ID
  const getIndexFromRowID = React.useCallback(
    (rowID: null | number | string): number => {
      if (rowID === null) {
        return -1
      }

      let currentIndex = 0
      const findIndex = (rows: SectionRow[]): number => {
        for (const row of rows) {
          if (row.rowID === rowID) {
            return currentIndex
          }
          currentIndex++
          if (row.rows && openItemKeys?.has(row.rowID)) {
            const found = findIndex(row.rows)
            if (found !== -1) {
              return found
            }
          }
        }
        return -1
      }

      return sections ? findIndex(sections) : -1
    },
    [sections, openItemKeys],
  )

  // Get the current focused row index for passing down to Row components
  const focusedRowIndex = React.useMemo(
    () => getIndexFromRowID(focusedRowID),
    [focusedRowID, getIndexFromRowID],
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
        if (selectionAnchorID === null) {
          setSelectionAnchorID(itemKey)
          // Just select this item as the starting point
          updateSelections({ itemKeys: [itemKey] })
          return
        }

        // Find indexes for anchor and current item
        const anchorIndex = getIndexFromRowID(selectionAnchorID)
        const currentIndex = getIndexFromRowID(itemKey)

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
          const row = getRowAtVisibleIndex(i)
          if (row && isRowFocusable(row)) {
            rangeItemKeys.push(row.rowID)
          }
        }

        updateSelections({ itemKeys: rangeItemKeys })
      } else {
        // Normal selection: toggle single item
        // Reset anchor for next shift selection
        setSelectionAnchorID(itemKey)

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
      selectionAnchorID,
      getIndexFromRowID,
      getRowAtVisibleIndex,
      isRowFocusable,
    ],
  )

  // Handle keyboard navigation
  const handleRowKeyPress = React.useCallback(
    ({ event, row }: { event: React.KeyboardEvent; row: SectionRow }) => {
      const { code, ctrlKey, metaKey, shiftKey } = event
      const isCtrlPressed = ctrlKey || metaKey

      switch (code) {
        case 'ArrowDown':
        case 'ArrowUp': {
          event.preventDefault()

          const direction: -1 | 1 = code === 'ArrowUp' ? -1 : 1
          const currentIndex = getIndexFromRowID(row.rowID)
          let nextIndex = currentIndex + direction

          // Find next focusable row
          while (nextIndex >= 0 && nextIndex < totalVisibleRows) {
            const nextRow = getRowAtVisibleIndex(nextIndex)
            if (nextRow && isRowFocusable(nextRow)) {
              setFocusedRowID(nextRow.rowID)

              // Handle shift+arrow for range selection
              if (shiftKey) {
                // Pass the selection event with shiftKey to the next row
                // The parent's selection logic should handle range selection
                onSelectionChange({
                  itemKey: nextRow.rowID,
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
          if (row.rows?.length || row.hasChildren) {
            event.preventDefault()
            toggleRowExpand(row.rowID)
          }
          break
        }

        // case 'Enter': {
        //   event.preventDefault()
        //   onEnter?.(row)
        //   break
        // }

        case 'Escape': {
          event.preventDefault()
          setFocusedRowID(null)
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
            itemKey: row.rowID,
            options: { ctrlKey, metaKey, shiftKey },
          })
          break
        }
      }
    },
    [
      getIndexFromRowID,
      totalVisibleRows,
      getRowAtVisibleIndex,
      isRowFocusable,
      // onEnter,
      onEscape,
      onSelectAll,
      toggleRowExpand,
      onSelectionChange,
    ],
  )

  const onRowDrag = React.useCallback(
    ({ event, item: dragItem }: { event: PointerEvent; item: null | SectionRow }) => {
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
  const [hoveredRowItemKey, setHoveredRowItemKey] = React.useState<ItemKey | null>(null)
  const [targetParentID, setTargetParentID] = React.useState<null | number | string>(null)

  const onDroppableHover = React.useCallback(
    ({
      hoveredRowItemKey: newHoveredRowItemKey,
      targetItem,
    }: {
      hoveredRowItemKey?: ItemKey
      targetItem: null | SectionRow
    }) => {
      setHoveredRowItemKey(newHoveredRowItemKey || null)
      setTargetParentID(targetItem?.rowID || null)
    },
    [],
  )

  useDndMonitor({
    onDragCancel() {
      setIsDragging(false)
      setHoveredRowItemKey(null)
      setTargetParentID(null)
      document.body.style.cursor = ''
    },
    onDragEnd(event) {
      setIsDragging(false)
      setHoveredRowItemKey(null)
      setTargetParentID(null)
      document.body.style.cursor = ''
      if (!event.over) {
        return
      }

      if (
        event.over.data.current.type === 'tree-view-table' &&
        'targetItem' in event.over.data.current
      ) {
        void onDrop({ targetItemKey: event.over.data.current.targetItem?.rowID })
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
          setFocusedRowID(null)
        }
      }}
      onFocus={(e) => {
        // Check if focus is entering the table from outside (not from a child)
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          // Focus the first selected row, or the first row if nothing is selected
          if (selectedItemKeys && selectedItemKeys.size > 0) {
            setFocusedRowID(Array.from(selectedItemKeys)[0])
          } else if (focusedRowID === null && sections && sections.length > 0) {
            setFocusedRowID(sections[0].rowID)
          }
        }
      }}
      role="table"
      tabIndex={-1}
    >
      <div className={baseClass}>
        <Header columns={columns} />

        <TableSection
          columns={columns}
          dropContextName={dropContextName}
          firstCellRef={firstCellRef}
          firstCellWidth={firstCellWidth}
          firstCellXOffset={firstCellXOffset}
          focusedRowIndex={focusedRowIndex}
          hoveredRowItemKey={hoveredRowItemKey}
          isDragging={isDragging}
          loadingRowItemKeys={loadingRowItemKeys}
          onDroppableHover={onDroppableHover}
          onFocusChange={(index) => {
            // Convert index back to row ID
            const row = getRowAtVisibleIndex(index)
            if (row) {
              setFocusedRowID(row.rowID)
            }
          }}
          onRowDrag={onRowDrag}
          onRowKeyPress={handleRowKeyPress}
          onSelectionChange={onSelectionChange}
          openItemKeys={openItemKeys}
          parentItems={[]}
          rowIndexOffset={0}
          rows={sections}
          segmentWidth={segmentWidth}
          selectedItemKeys={selectedItemKeys}
          targetParentID={targetParentID}
          toggleRowExpand={toggleRowExpand}
        />
      </div>
    </div>
  )
}
