import React from 'react'

import { DraggableWithClick } from '../../folderView/DraggableWithClick/index.js'
import { RowDropArea } from './RowDropArea/index.js'
import './index.scss'

interface SectionRow {
  [key: string]: any
  children?: SectionRow[]
  name?: string
  rowID: string
}

interface Column {
  label?: string
  name: string
}

interface NestedSectionsTableProps {
  className?: string
  columns?: Column[]
  dragStartX?: number
  initialOffset?: number
  isDragging?: boolean
  sections?: SectionRow[]
  segmentWidth?: number
}

interface DivTableHeaderProps {
  columns: Column[]
}

interface DivTableSectionProps {
  columns: Column[]
  dragStartX: number
  hoveredRowID: null | string
  initialOffset: number
  isDragging: boolean
  isLastRowOfRoot?: boolean
  level?: number
  onDropZoneHover: (params: { placement?: string; targetItem: null | SectionRow }) => void
  parentItems?: SectionRow[]
  sectionRows: SectionRow[]
  segmentWidth: number
}

const exampleData = [
  {
    name: 'About',
    children: [
      {
        name: 'Team',
        children: [
          {
            name: 'Jakes Team',
            rowID: '1.1.1',
          },
          { name: 'James Team', rowID: '1.1.2' },
        ],
        rowID: '1.1',
      },
      {
        name: 'Projects',
        rowID: '1.2',
      },
      {
        name: 'Team',
        children: [
          { name: 'Member 1', rowID: '1.3.1' },
          { name: 'Member 2', rowID: '1.3.2' },
        ],
        rowID: '1.3',
      },
    ],
    rowID: '1',
  },
  { name: 'Contact', rowID: '2' },
  { name: 'Docs', rowID: '3' },
]

const baseClass = 'nested-sections-table'
const DEFAULT_SEGMENT_WIDTH = 30
const DEFAULT_INITIAL_OFFSET = 56

export const NestedSectionsTable: React.FC<NestedSectionsTableProps> = ({
  className = '',
  columns = [{ name: 'rowID' }, { name: 'name' }],
  dragStartX = 0,
  initialOffset = DEFAULT_INITIAL_OFFSET,
  isDragging = false,
  sections = exampleData,
  segmentWidth = DEFAULT_SEGMENT_WIDTH,
}) => {
  const [hoveredRowID, setHoveredRowID] = React.useState<null | string>(null)
  const onDropZoneHover = React.useCallback(({ targetItem }: { targetItem: null | SectionRow }) => {
    setHoveredRowID(targetItem?.rowID || null)
  }, [])

  return (
    <div
      className={[`${baseClass}__wrapper`, isDragging && `${baseClass}--dragging`, className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={baseClass}>
        <DivTableHeader columns={columns} />
        <DivTableSection
          columns={columns}
          dragStartX={dragStartX}
          hoveredRowID={hoveredRowID}
          initialOffset={initialOffset}
          isDragging={isDragging}
          onDropZoneHover={onDropZoneHover}
          parentItems={[]}
          sectionRows={sections}
          segmentWidth={segmentWidth}
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
  dragStartX,
  hoveredRowID,
  initialOffset,
  isDragging,
  isLastRowOfRoot = false,
  level = 0,
  onDropZoneHover,
  parentItems = [],
  sectionRows,
  segmentWidth,
}) => {
  return (
    <>
      {sectionRows.map((sectionRowItem, sectionRowIndex: number) => {
        const isLastRow = sectionRows.length - 1 === sectionRowIndex
        const hasNestedSection = Boolean(sectionRowItem?.children?.length)
        const isRowAtRootLevel = level === 0 || (isLastRow && isLastRowOfRoot)

        // Calculate drop target items based on position in hierarchy
        let targetItems: (null | SectionRow)[] = []

        if (level === 0) {
          targetItems = hasNestedSection ? [sectionRowItem] : []
        } else if (isLastRow) {
          targetItems = hasNestedSection ? [sectionRowItem] : [...parentItems]
        } else {
          targetItems = hasNestedSection ? [sectionRowItem] : [parentItems[parentItems.length - 1]]
        }

        // Allow dropping at root level for last row without nested sections
        if (isRowAtRootLevel && !hasNestedSection) {
          targetItems = [null, ...targetItems]
        }

        return (
          <React.Fragment key={sectionRowItem.rowID}>
            <div
              className={`${baseClass}__section ${hoveredRowID === sectionRowItem.rowID ? `${baseClass}__section--hovered` : ''}`}
            >
              <DraggableWithClick className={`${baseClass}__row`} onClick={() => {}}>
                {columns.map((col) => (
                  <div
                    className={`${baseClass}__cell`}
                    key={col.name}
                    style={
                      col.name === 'name'
                        ? {
                            paddingLeft: level * segmentWidth,
                            width: '100%',
                          }
                        : undefined
                    }
                  >
                    {`${sectionRowItem[col.name] ? `${sectionRowItem[col.name]}` : `${sectionRowItem.rowID}`}`}
                  </div>
                ))}

                <div>
                  <RowDropArea
                    dragStartX={dragStartX}
                    isDragging={isDragging}
                    onHover={onDropZoneHover}
                    placement="middle"
                    segmentWidth={segmentWidth}
                    style={{ left: 0, width: '100%' }}
                    targetItems={[sectionRowItem]}
                  />

                  <RowDropArea
                    dragStartX={dragStartX}
                    isDragging={isDragging}
                    markerLeftOffset={
                      isLastRow && !hasNestedSection
                        ? initialOffset + segmentWidth * (level - targetItems.length + 1)
                        : initialOffset + segmentWidth * (hasNestedSection ? level + 1 : level)
                    }
                    onHover={onDropZoneHover}
                    segmentWidth={segmentWidth}
                    style={{
                      left: 0,
                      width: '100%',
                    }}
                    targetItems={targetItems}
                  />
                </div>
              </DraggableWithClick>
            </div>

            {sectionRowItem.children && sectionRowItem.children.length > 0 && (
              <DivTableSection
                columns={columns}
                dragStartX={dragStartX}
                hoveredRowID={hoveredRowID}
                initialOffset={initialOffset}
                isDragging={isDragging}
                isLastRowOfRoot={isRowAtRootLevel}
                level={level + 1}
                onDropZoneHover={onDropZoneHover}
                parentItems={[...parentItems, sectionRowItem]}
                sectionRows={sectionRowItem.children}
                segmentWidth={segmentWidth}
              />
            )}
          </React.Fragment>
        )
      })}
    </>
  )
}
