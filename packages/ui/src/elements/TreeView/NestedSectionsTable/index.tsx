import React from 'react'

import { CheckboxInput } from '../../../fields/Checkbox/Input.js'
import { ChevronIcon } from '../../../icons/Chevron/index.js'
import { DragHandleIcon } from '../../../icons/DragHandle/index.js'
import { Button } from '../../Button/index.js'
import { DraggableWithClick } from '../../DraggableWithClick/index.js'
import { Pill } from '../../Pill/index.js'
import { RowDropArea } from './RowDropArea/index.js'
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
  hoveredRowID?: null | number | string
  initialOffset?: number
  isDragging?: boolean
  loadingRowIDs?: Set<number | string>
  onDroppableHover: (params: {
    hoveredRowID?: number | string
    placement?: string
    targetItem: null | SectionRow
  }) => void
  onRowClick?: ({
    event,
    from,
    row,
  }: {
    event: React.MouseEvent<HTMLElement>
    from: 'checkbox' | 'dragHandle'
    row: SectionRow
  }) => void
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
    from: 'checkbox' | 'dragHandle'
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
        <div className={`${baseClass}__header`}>
          <div className={`${baseClass}__header-cell`}>
            <div className={`${baseClass}__row-actions`}>
              <CheckboxInput
                // checked={}
                onToggle={
                  ((event: React.MouseEvent<HTMLElement>) => {
                    // toggle all visible rows
                    // onRowClick({ event, from: 'checkbox', row})
                  }) as unknown as (event: React.ChangeEvent) => void
                }
              />
            </div>
          </div>
          {columns.map((col) => (
            <div className={`${baseClass}__header-cell`} key={col.name}>
              {col.label || col.name}
            </div>
          ))}
        </div>

        <DivTableSection
          columns={[{ name: '_tree-actions' }, ...columns]}
          dropContextName={dropContextName}
          firstCellRef={firstCellRef}
          firstCellWidth={firstCellWidth}
          firstCellXOffset={firstCellXOffset}
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

        const isOdd = absoluteRowIndex % 2 === 1
        const isRowSelected = selectedRowIDs.includes(rowItem.rowID)
        const isInvalidTarget = hasSelectedAncestor || isRowSelected

        const renderResult = (
          <React.Fragment key={rowItem.rowID}>
            <div
              className={[
                `${baseClass}__section`,
                isDragging && `${baseClass}__section--dragging`,
                isDragging && isInvalidTarget && `${baseClass}__section--invalid-target`,
                isOdd && `${baseClass}__section--odd`,
                targetParentID === rowItem.rowID && `${baseClass}__section--target`,
                isRowSelected && `${baseClass}__section--selected`,
              ]
                .filter(Boolean)
                .join(' ')}
              onKeyDown={
                onRowKeyPress
                  ? (event) => {
                      // Support Enter/Space for accessibility
                      onRowKeyPress({ event, row: rowItem })
                    }
                  : undefined
              }
              role="button"
              tabIndex={0}
            >
              <div className={`${baseClass}__row`}>
                <div
                  className={`${baseClass}__cell`}
                  ref={level === 0 && sectionRowIndex === 0 ? firstCellRef : null}
                >
                  <div className={`${baseClass}__row-actions`}>
                    <CheckboxInput
                      checked={selectedRowIDs.includes(rowItem.rowID)}
                      onToggle={
                        ((event: React.MouseEvent<HTMLElement>) => {
                          onRowClick({ event, from: 'checkbox', row: rowItem })
                        }) as unknown as (event: React.ChangeEvent) => void
                      }
                    />
                    <DraggableWithClick
                      disabled={
                        selectedRowIDs.length > 1 && !selectedRowIDs.includes(rowItem.rowID)
                      }
                      onClick={(event) => {
                        // needed for dragging unselected items
                        onRowClick({ event, from: 'dragHandle', row: rowItem })
                      }}
                      onDrag={(event) => {
                        onRowDrag({
                          event,
                          item: rowItem,
                        })
                      }}
                    >
                      <DragHandleIcon />
                    </DraggableWithClick>
                  </div>
                </div>
                {columns.map((col) =>
                  col.name === '_tree-actions' ? null : (
                    <div
                      className={`${baseClass}__cell`}
                      key={col.name}
                      style={
                        // TODO: temporary - will need to know title field name of document
                        col.name === 'name'
                          ? {
                              width: '100%',
                            }
                          : undefined
                      }
                    >
                      {col.name === 'name' ? (
                        <span
                          style={{
                            alignItems: 'center',
                            display: 'flex',
                            gap: '8px',
                            paddingLeft: level * segmentWidth,
                            width: '100%',
                          }}
                        >
                          {rowItem.hasChildren || rowItem.rows?.length ? (
                            <Button
                              buttonStyle="none"
                              className={`${baseClass}__tree-toggle`}
                              margin={false}
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleRow(rowItem.rowID)
                              }}
                              size="small"
                            >
                              {loadingRowIDs?.has(rowItem.rowID) ? (
                                <div className={`${baseClass}__tree-toggle-spinner`}>
                                  <div className={`${baseClass}__spinner-bar`} />
                                  <div className={`${baseClass}__spinner-bar`} />
                                  <div className={`${baseClass}__spinner-bar`} />
                                </div>
                              ) : (
                                <ChevronIcon
                                  direction={openItemIDs?.has(rowItem.rowID) ? 'down' : 'right'}
                                />
                              )}
                            </Button>
                          ) : (
                            <div className={`${baseClass}__tree-toggle-placeholder`} />
                          )}
                          <Pill
                            pillStyle="light-gray"
                            size="small"
                          >{`${rowItem[col.name] ? `${rowItem[col.name]}` : `!`}`}</Pill>
                        </span>
                      ) : (
                        `${rowItem[col.name] ? `${rowItem[col.name]}` : `!`}`
                      )}
                    </div>
                  ),
                )}
                <div>
                  <RowDropArea
                    disabled={isInvalidTarget}
                    dropContextName={dropContextName}
                    isDragging={isDragging}
                    onHover={(data) => {
                      onDroppableHover({ ...data, hoveredRowID: rowItem.rowID })
                    }}
                    placement="middle"
                    segmentWidth={segmentWidth}
                    style={{ left: 0, width: '100%' }}
                    targetItems={[rowItem]}
                  />

                  <RowDropArea
                    disabled={isInvalidTarget}
                    dropContextName={dropContextName}
                    isDragging={isDragging}
                    onHover={(data) => {
                      onDroppableHover({ ...data, hoveredRowID: rowItem.rowID })
                    }}
                    placement="split"
                    segmentWidth={segmentWidth}
                    style={{
                      left: 0,
                      width: '100%',
                    }}
                    targetItems={targetItems}
                    xDragOffset={firstCellXOffset + startOffset}
                    xSplitOffset={`calc(${startOffset}px + var(--cell-inline-padding-start))`}
                  />
                </div>
              </div>
            </div>

            {/* Render placeholder row below the hovered row */}
            {isDragging && hoveredRowID === rowItem.rowID && (
              <div className={`${baseClass}__placeholder-section`}>
                <div className={`${baseClass}__placeholder-row`}>
                  {columns.map((col) => (
                    <div className={`${baseClass}__cell`} key={col.name}>
                      <div className={`${baseClass}__placeholder-cell-bg`} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasNestedRows && (
              <DivTableSection
                columns={columns}
                dropContextName={dropContextName}
                firstCellWidth={firstCellWidth}
                firstCellXOffset={firstCellXOffset}
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
