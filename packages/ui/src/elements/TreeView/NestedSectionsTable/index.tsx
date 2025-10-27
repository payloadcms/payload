import React from 'react'

import { Header } from './Header/index.js'
import { NestedSectionsTableRow } from './Row/index.js'
import './index.scss'

export type SectionRow = {
  name: string
  rowID: number | string
  rows?: SectionRow[]
} & Record<string, any>

interface Column {
  label?: string
  name: string
}

interface NestedSectionsTableProps {
  className?: string
  columns?: Column[]
  disabledRowIDs?: (number | string)[]
  dropContextName: string
  focusedRowIndex?: number
  hoveredRowID?: null | number | string
  initialOffset?: number
  isDragging?: boolean
  loadingRowIDs?: Set<number | string>
  onDroppableHover: (params: {
    hoveredRowID?: number | string
    placement?: string
    targetItem: null | SectionRow
  }) => void
  onRowClick?: ({ event, row }: { event: React.MouseEvent<HTMLElement>; row: SectionRow }) => void
  onRowDrag?: (params: { event: PointerEvent; item: null | SectionRow }) => void
  onRowKeyPress?: (params: { event: React.KeyboardEvent; row: SectionRow }) => void
  openItemIDs?: Set<number | string>
  sections?: SectionRow[]
  segmentWidth?: number
  selectedRowIDs?: (number | string)[]
  targetParentID?: null | number | string
  toggleRow?: (docID: number | string) => void
}

interface DivTableSectionProps {
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
  onRowClick: ({
    event,
    from,
    row,
  }: {
    event: React.MouseEvent<HTMLElement>
    from: 'dragHandle' | 'row'
    row: SectionRow
  }) => void
  onRowDrag: (params: { event: PointerEvent; item: null | SectionRow }) => void
  onRowKeyPress?: (params: { event: React.KeyboardEvent; row: SectionRow }) => void
  openItemIDs?: Set<number | string>
  parentItems?: SectionRow[]
  rowIndexOffset?: number
  rows: SectionRow[]
  segmentWidth: number
  selectedRowIDs?: (number | string)[]
  targetParentID: null | number | string
  toggleRow?: (docID: number | string) => void
}

const baseClass = 'nested-sections-table'
const DEFAULT_SEGMENT_WIDTH = 30

export const NestedSectionsTable: React.FC<NestedSectionsTableProps> = ({
  className = '',
  columns = [{ name: 'name', label: 'Name' }],
  disabledRowIDs,
  dropContextName,
  focusedRowIndex,
  hoveredRowID,
  isDragging = false,
  loadingRowIDs,
  onDroppableHover,
  onRowClick,
  onRowDrag,
  onRowKeyPress,
  openItemIDs,
  sections,
  segmentWidth = DEFAULT_SEGMENT_WIDTH,
  selectedRowIDs,
  targetParentID,
  toggleRow,
}) => {
  const [firstCellXOffset, setFirstCellXOffset] = React.useState(0)
  const [firstCellWidth, setFirstCellWidth] = React.useState(0)
  const firstCellRef = React.useRef<HTMLDivElement>(null)
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
    >
      <div className={baseClass}>
        <Header columns={columns} />

        <DivTableSection
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
          onRowClick={onRowClick}
          onRowDrag={onRowDrag}
          onRowKeyPress={onRowKeyPress}
          openItemIDs={openItemIDs}
          parentItems={[]}
          rowIndexOffset={0}
          rows={sections}
          segmentWidth={segmentWidth}
          selectedRowIDs={selectedRowIDs}
          targetParentID={targetParentID}
          toggleRow={toggleRow}
        />
      </div>
    </div>
  )
}

export const DivTableSection: React.FC<DivTableSectionProps> = ({
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
  onRowClick,
  onRowDrag,
  onRowKeyPress,
  openItemIDs,
  parentItems = [],
  rowIndexOffset = 0,
  rows,
  segmentWidth,
  selectedRowIDs = [],
  targetParentID,
  toggleRow,
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
        offset += countRows(rows[i].rows)
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

        const isRowSelected = selectedRowIDs.includes(rowItem.rowID)
        const isInvalidTarget = hasSelectedAncestor || isRowSelected
        const isFirstRowAtRootLevel = level === 0 && sectionRowIndex === 0

        const renderResult = (
          <React.Fragment key={rowItem.rowID}>
            <NestedSectionsTableRow
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
              onRowClick={onRowClick}
              onRowDrag={onRowDrag}
              onRowKeyPress={onRowKeyPress}
              openItemIDs={openItemIDs}
              rowItem={rowItem}
              segmentWidth={segmentWidth}
              selectedRowIDs={selectedRowIDs}
              startOffset={startOffset}
              targetItems={targetItems}
              targetParentID={targetParentID}
              toggleRow={toggleRow}
            />

            {hasNestedRows && (
              <DivTableSection
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
                onRowClick={onRowClick}
                onRowDrag={onRowDrag}
                onRowKeyPress={onRowKeyPress}
                openItemIDs={openItemIDs}
                parentItems={[...parentItems, rowItem]}
                rowIndexOffset={absoluteRowIndex + 1}
                rows={rowItem.rows}
                segmentWidth={segmentWidth}
                selectedRowIDs={selectedRowIDs}
                targetParentID={targetParentID}
                toggleRow={toggleRow}
              />
            )}
          </React.Fragment>
        )

        return renderResult
      })}
    </>
  )
}
