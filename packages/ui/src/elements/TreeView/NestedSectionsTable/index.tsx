import { CheckboxInput, DragHandleIcon, Pill } from '@payloadcms/ui'
import React from 'react'

import { DraggableWithClick } from '../../folderView/DraggableWithClick/index.js'
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
  dragStartX?: number
  dropContextName: string
  hoveredRowID?: null | number | string
  initialOffset?: number
  isDragging?: boolean
  onDroppableHover: (params: { placement?: string; targetItem: null | SectionRow }) => void
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
}

interface DivTableHeaderProps {
  columns: Column[]
}

interface DivTableSectionProps {
  columns: Column[]
  dropContextName: string
  firstCellRef?: React.RefObject<HTMLDivElement>
  firstCellWidth: number
  firstCellXOffset: number
  hoveredRowID: null | number | string
  isDragging: boolean
  isLastRowOfRoot?: boolean
  level?: number
  onDroppableHover: (params: { placement?: string; targetItem: null | SectionRow }) => void
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
  rows: SectionRow[]
  segmentWidth: number
  selectedRowIDs?: (number | string)[]
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
  dropContextName,
  hoveredRowID,
  isDragging = false,
  onDroppableHover,
  onRowClick,
  onRowDrag,
  sections = exampleData,
  segmentWidth = DEFAULT_SEGMENT_WIDTH,
  selectedRowIDs,
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
          rows={sections}
          segmentWidth={segmentWidth}
          selectedRowIDs={selectedRowIDs}
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
  rows,
  segmentWidth,
  selectedRowIDs = [],
}) => {
  return (
    <>
      {rows.map((rowItem, sectionRowIndex: number) => {
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

        return (
          <React.Fragment key={rowItem.rowID}>
            <div
              className={`${baseClass}__section ${hoveredRowID === rowItem.rowID ? `${baseClass}__section--hovered` : ''} ${
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
                    onHover={onDroppableHover}
                    placement="middle"
                    segmentWidth={segmentWidth}
                    style={{ left: 0, width: '100%' }}
                    targetItems={[rowItem]}
                  />

                  <RowDropArea
                    dropContextName={dropContextName}
                    isDragging={isDragging}
                    onHover={onDroppableHover}
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

            {hasNestedRows && (
              <DivTableSection
                columns={columns}
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
                rows={rowItem.rows}
                segmentWidth={segmentWidth}
                selectedRowIDs={selectedRowIDs}
              />
            )}
          </React.Fragment>
        )
      })}
    </>
  )
}
