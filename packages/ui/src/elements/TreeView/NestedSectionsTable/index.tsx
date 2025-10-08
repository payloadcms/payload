import type { TreeViewDocument } from 'payload/shared'

import React from 'react'

import { CheckboxInput } from '../../../fields/Checkbox/Input.js'
import { DragHandleIcon } from '../../../icons/DragHandle/index.js'
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
  draggedItem?: TreeViewDocument
  dragStartX?: number
  dropContextName: string
  hoveredRowID?: null | number | string
  initialOffset?: number
  isDragging?: boolean
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
  sections?: SectionRow[]
  segmentWidth?: number
  selectedRowIDs?: (number | string)[]
  targetParentID?: null | number | string
}

interface DivTableHeaderProps {
  columns: Column[]
}

interface DivTableSectionProps {
  columns: Column[]
  draggedItem?: TreeViewDocument
  dropContextName: string
  firstCellRef?: React.RefObject<HTMLDivElement>
  firstCellWidth: number
  firstCellXOffset: number
  hoveredRowID: null | number | string
  isDragging: boolean
  isLastRowOfRoot?: boolean
  level?: number
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
  parentItems?: SectionRow[]
  rowIndexOffset?: number
  rows: SectionRow[]
  segmentWidth: number
  selectedRowIDs?: (number | string)[]
  targetParentID: null | number | string
}

const exampleData: SectionRow[] = [
  {
    name: 'About',
    rowID: '1',
    rows: [
      {
        name: 'Team',
        rowID: '1.1',
        rows: [
          {
            name: 'Jakes Team',
            rowID: '1.1.1',
          },
          { name: 'James Team', rowID: '1.1.2' },
        ],
      },
      {
        name: 'Projects',
        rowID: '1.2',
      },
      {
        name: 'Team',
        rowID: '1.3',
        rows: [
          { name: 'Member 1', rowID: '1.3.1' },
          { name: 'Member 2', rowID: '1.3.2' },
        ],
      },
    ],
  },
  { name: 'Contact', rowID: '2' },
  { name: 'Docs', rowID: '3' },
]

const baseClass = 'nested-sections-table'
const DEFAULT_SEGMENT_WIDTH = 30

export const NestedSectionsTable: React.FC<NestedSectionsTableProps> = ({
  className = '',
  columns = [{ name: 'name' }],
  disabledRowIDs,
  draggedItem,
  dropContextName,
  hoveredRowID,
  isDragging = false,
  onDroppableHover,
  onRowClick,
  onRowDrag,
  sections = exampleData,
  segmentWidth = DEFAULT_SEGMENT_WIDTH,
  selectedRowIDs,
  targetParentID,
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
        <DivTableHeader columns={columns} />
        <DivTableSection
          columns={[{ name: '_tree-actions' }, ...columns]}
          draggedItem={draggedItem}
          dropContextName={dropContextName}
          firstCellRef={firstCellRef}
          firstCellWidth={firstCellWidth}
          firstCellXOffset={firstCellXOffset}
          hoveredRowID={hoveredRowID}
          isDragging={isDragging}
          onDroppableHover={onDroppableHover}
          onRowClick={onRowClick}
          onRowDrag={onRowDrag}
          parentItems={[]}
          rowIndexOffset={0}
          rows={sections}
          segmentWidth={segmentWidth}
          selectedRowIDs={selectedRowIDs}
          targetParentID={targetParentID}
        />
      </div>
    </div>
  )
}

export const DivTableHeader: React.FC<DivTableHeaderProps> = ({ columns }) => {
  return (
    <div className={`${baseClass}__header`}>
      {columns.map((col) => (
        <div className={`${baseClass}__header-cell`} key={col.name}>
          {col.label || col.name}
        </div>
      ))}
    </div>
  )
}

export const DivTableSection: React.FC<DivTableSectionProps> = ({
  columns,
  draggedItem,
  dropContextName,
  firstCellRef,
  firstCellWidth,
  firstCellXOffset,
  hoveredRowID,
  isDragging,
  isLastRowOfRoot = false,
  level = 0,
  onDroppableHover,
  onRowClick,
  onRowDrag,
  parentItems = [],
  rowIndexOffset = 0,
  rows,
  segmentWidth,
  selectedRowIDs = [],
  targetParentID,
}) => {
  // Helper to count all rows recursively
  const countRows = (items: SectionRow[]): number => {
    return items.reduce((count, item) => {
      return count + 1 + (item.rows ? countRows(item.rows) : 0)
    }, 0)
  }

  // Calculate absolute row index for each row before render
  const getAbsoluteRowIndex = (index: number): number => {
    let offset = rowIndexOffset
    for (let i = 0; i < index; i++) {
      offset += 1
      if (rows[i].rows) {
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
        const hasNestedRows = Boolean(rowItem?.rows?.length)
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
            ? firstCellWidth + segmentWidth * (level - targetItems.length + 1)
            : firstCellWidth + segmentWidth * (hasNestedRows ? level + 1 : level)

        const isOdd = absoluteRowIndex % 2 === 1

        const renderResult = (
          <React.Fragment key={rowItem.rowID}>
            <div
              className={`${baseClass}__section ${baseClass}__section-background ${isOdd ? `${baseClass}__section--odd` : ''} ${targetParentID === rowItem.rowID ? `${baseClass}__section--hovered` : ''} ${
                selectedRowIDs.includes(rowItem.rowID) ? `${baseClass}__section--selected` : ''
              }`}
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
                            paddingLeft: level * segmentWidth,
                            width: '100%',
                          }}
                        >
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
                draggedItem={draggedItem}
                dropContextName={dropContextName}
                firstCellWidth={firstCellWidth}
                firstCellXOffset={firstCellXOffset}
                hoveredRowID={hoveredRowID}
                isDragging={isDragging}
                isLastRowOfRoot={isRowAtRootLevel}
                level={level + 1}
                onDroppableHover={onDroppableHover}
                onRowClick={onRowClick}
                onRowDrag={onRowDrag}
                parentItems={[...parentItems, rowItem]}
                rowIndexOffset={absoluteRowIndex + 1}
                rows={rowItem.rows}
                segmentWidth={segmentWidth}
                selectedRowIDs={selectedRowIDs}
                targetParentID={targetParentID}
              />
            )}
          </React.Fragment>
        )

        return renderResult
      })}
    </>
  )
}
