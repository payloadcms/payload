import React from 'react'

import type { Column, ItemKey, SectionRow } from '../types.js'

import { Row } from '../Row/index.js'

interface RenderTableSectionProps {
  columns: Column[]
  dropContextName: string
  firstCellRef?: React.RefObject<HTMLDivElement>
  firstCellWidth: number
  firstCellXOffset: number
  focusedRowIndex?: number
  hasSelectedAncestor?: boolean
  hoveredRowID: null | number | string
  isDragging: boolean
  isLastRowOfRoot?: boolean
  level?: number
  loadingRowIDs?: Set<number | string>
  onDroppableHover: (params: {
    hoveredRowID?: number | string
    placement?: string
    targetItem: null | SectionRow
  }) => void
  onFocusChange: (focusedIndex: number) => void
  onRowDrag: (params: { event: PointerEvent; item: null | SectionRow }) => void
  onRowKeyPress: (params: { event: React.KeyboardEvent; row: SectionRow }) => void
  onSelectionChange: ({
    itemKey,
    options,
  }: {
    itemKey: `${string}-${number | string}`
    options: {
      ctrlKey: boolean
      metaKey: boolean
      shiftKey: boolean
    }
  }) => void
  openItemIDs?: Set<number | string>
  parentItems?: SectionRow[]
  rowIndexOffset?: number
  rows: SectionRow[]
  segmentWidth: number
  selectedItemKeys?: Set<ItemKey>
  targetParentID: null | number | string
  toggleRowExpand: (docID: number | string) => void
}

export const TableSection: React.FC<RenderTableSectionProps> = ({
  columns,
  dropContextName,
  firstCellRef,
  firstCellWidth,
  firstCellXOffset,
  focusedRowIndex,
  hasSelectedAncestor = false,
  hoveredRowID,
  isDragging,
  isLastRowOfRoot = false,
  level = 0,
  loadingRowIDs,
  onDroppableHover,
  onFocusChange,
  onRowDrag,
  onRowKeyPress,
  onSelectionChange,
  openItemIDs,
  parentItems = [],
  rowIndexOffset = 0,
  rows,
  segmentWidth,
  selectedItemKeys = new Set<ItemKey>(),
  targetParentID,
  toggleRowExpand: toggleRow,
}) => {
  // Helper to count all rows recursively, only counting visible (open) rows
  const countRows = (items: SectionRow[]): number => {
    return items.reduce((count, item) => {
      const isOpen = openItemIDs?.has(item.rowID)
      return count + 1 + (item.rows && isOpen ? countRows(item.rows) : 0)
    }, 0)
  }

  // Calculate absolute row index for each row before render
  const getAbsoluteRowIndex = (index: number): number => {
    let offset = rowIndexOffset
    for (let i = 0; i < index; i++) {
      offset += 1
      const isOpen = openItemIDs?.has(rows[i].rowID)
      if (rows[i].rows && isOpen) {
        offset += countRows(rows[i].rows || [])
      }
    }
    return offset
  }

  return (
    <>
      {rows.map((rowItem, sectionRowIndex: number) => {
        const absoluteRowIndex = getAbsoluteRowIndex(sectionRowIndex)
        const isLastRow = rows.length - 1 === sectionRowIndex
        const hasNestedRows = Boolean(rowItem?.rows?.length) && openItemIDs?.has(rowItem.rowID)
        const isRowAtRootLevel = level === 0 || (isLastRow && isLastRowOfRoot)

        // Calculate drop target items based on position in hierarchy
        let targetItems: (null | SectionRow)[] = []

        if (level === 0) {
          targetItems = hasNestedRows ? [rowItem] : []
        } else if (isLastRow) {
          targetItems = hasNestedRows
            ? [rowItem]
            : isRowAtRootLevel
              ? [...parentItems]
              : [parentItems[parentItems.length - 2], parentItems[parentItems.length - 1]].filter(
                  Boolean,
                )
        } else {
          targetItems = hasNestedRows ? [rowItem] : [parentItems[parentItems.length - 1]]
        }

        // Allow dropping at root level for last row without nested sections
        if (isRowAtRootLevel && !hasNestedRows) {
          targetItems = [null, ...targetItems]
        }

        const startOffset =
          isLastRow && !hasNestedRows
            ? firstCellWidth + segmentWidth * (level - targetItems.length + 1) + 28
            : firstCellWidth + segmentWidth * (hasNestedRows ? level + 1 : level) + 28

        const isRowSelected = selectedItemKeys.has(rowItem.rowID)
        const isInvalidTarget = hasSelectedAncestor || isRowSelected
        const isFirstRowAtRootLevel = level === 0 && sectionRowIndex === 0

        const renderResult = (
          <React.Fragment key={rowItem.rowID}>
            <Row
              absoluteRowIndex={absoluteRowIndex}
              columns={columns}
              dropContextName={dropContextName}
              firstCellRef={level === 0 && sectionRowIndex === 0 ? firstCellRef : undefined}
              firstCellWidth={firstCellWidth}
              firstCellXOffset={firstCellXOffset}
              focusedRowIndex={focusedRowIndex}
              hasSelectedAncestor={hasSelectedAncestor}
              hoveredRowID={hoveredRowID}
              isDragging={isDragging}
              isFirstRowAtRootLevel={isFirstRowAtRootLevel}
              isInvalidTarget={isInvalidTarget}
              isLastRow={isLastRow}
              isRowAtRootLevel={isRowAtRootLevel}
              isRowSelected={isRowSelected}
              level={level}
              loadingRowIDs={loadingRowIDs}
              onDroppableHover={onDroppableHover}
              onFocusChange={onFocusChange}
              onRowDrag={onRowDrag}
              onRowKeyPress={onRowKeyPress}
              onSelectionChange={onSelectionChange}
              openItemIDs={openItemIDs}
              rowItem={rowItem}
              segmentWidth={segmentWidth}
              selectedItemKeys={selectedItemKeys}
              startOffset={startOffset}
              targetItems={targetItems}
              targetParentID={targetParentID}
              toggleRowExpand={toggleRow}
            />

            {hasNestedRows && rowItem.rows && (
              <TableSection
                columns={columns}
                dropContextName={dropContextName}
                firstCellWidth={firstCellWidth}
                firstCellXOffset={firstCellXOffset}
                focusedRowIndex={focusedRowIndex}
                hasSelectedAncestor={hasSelectedAncestor || isRowSelected}
                hoveredRowID={hoveredRowID}
                isDragging={isDragging}
                isLastRowOfRoot={isRowAtRootLevel}
                level={level + 1}
                loadingRowIDs={loadingRowIDs}
                onDroppableHover={onDroppableHover}
                onFocusChange={onFocusChange}
                onRowDrag={onRowDrag}
                onRowKeyPress={onRowKeyPress}
                onSelectionChange={onSelectionChange}
                openItemIDs={openItemIDs}
                parentItems={[...parentItems, rowItem]}
                rowIndexOffset={absoluteRowIndex + 1}
                rows={rowItem.rows}
                segmentWidth={segmentWidth}
                selectedItemKeys={selectedItemKeys}
                targetParentID={targetParentID}
                toggleRowExpand={toggleRow}
              />
            )}
          </React.Fragment>
        )

        return renderResult
      })}
    </>
  )
}
