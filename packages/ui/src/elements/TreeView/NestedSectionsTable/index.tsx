import React from 'react'

import type { NestedSectionsTableProps, SectionRow } from './types.js'

import { Header } from './Header/index.js'
import { TableSection } from './TableSection/index.js'
import './index.scss'

const baseClass = 'nested-sections-table'
const DEFAULT_SEGMENT_WIDTH = 30

export const NestedSectionsTable: React.FC<NestedSectionsTableProps> = ({
  className = '',
  columns = [{ name: 'name', label: 'Name' }],
  dropContextName,
  hoveredRowID,
  isDragging = false,
  isRowFocusable = () => true,
  loadingRowIDs,
  onDroppableHover,
  onEnter,
  onEscape,
  onRowDrag,
  onSelectAll,
  openItemIDs,
  sections,
  segmentWidth = DEFAULT_SEGMENT_WIDTH,
  selectedItemKeys,
  targetParentID,
  toggleRowExpand,
  updateSelections,
}) => {
  const [focusedRowID, setFocusedRowID] = React.useState<null | number | string>(null)
  const [selectionAnchorID, setSelectionAnchorID] = React.useState<null | number | string>(null)
  const [firstCellXOffset, setFirstCellXOffset] = React.useState(0)
  const [firstCellWidth, setFirstCellWidth] = React.useState(0)
  const firstCellRef = React.useRef<HTMLDivElement>(null)

  // Helper to count all visible rows (including nested)
  const countVisibleRows = React.useCallback(
    (rows: SectionRow[]): number => {
      let count = 0
      for (const row of rows) {
        count++
        if (row.rows && openItemIDs?.has(row.rowID)) {
          count += countVisibleRows(row.rows)
        }
      }
      return count
    },
    [openItemIDs],
  )

  const totalVisibleRows = React.useMemo(
    () => (sections ? countVisibleRows(sections) : 0),
    [sections, countVisibleRows],
  )

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
          if (row.rows && openItemIDs?.has(row.rowID)) {
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
    [sections, openItemIDs],
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
          if (row.rows && openItemIDs?.has(row.rowID)) {
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
    [sections, openItemIDs],
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

          if (shiftKey) {
            onSelectionChange({
              itemKey: row.rowID,
              options: { ctrlKey, metaKey, shiftKey },
            })
          }

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

        case 'Enter': {
          event.preventDefault()
          onEnter?.(row)
          break
        }

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
      onEnter,
      onEscape,
      onSelectAll,
      toggleRowExpand,
      onSelectionChange,
    ],
  )

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
          hoveredRowID={hoveredRowID}
          isDragging={isDragging}
          loadingRowIDs={loadingRowIDs}
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
          openItemIDs={openItemIDs}
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
