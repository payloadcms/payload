import { useDroppable } from '@dnd-kit/core'
import React from 'react'

import { DraggableWithClick } from '../../folderView/DraggableWithClick/index.js'
import './index.scss'

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

const baseClass = 'nested-items-table'
const SEGMENT_WIDTH = 30
const INITIAL_OFFSET = 56

export const NestedItemsTable = ({
  className = '',
  columns = [{ test: 'Test' }, { name: 'name' }],
  data = exampleData,
  dragStartX = 0,
  isDragging = false,
}) => {
  const [hoveredRowID, setHoveredRowID] = React.useState(null)
  const onDropZoneHover = ({ placement, targetItem }) => {
    setHoveredRowID(targetItem?.rowID || null)
    console.log('Drop zone hover:', { placement, targetItem })
    // targetItem is the calculated target parent based on hover position
    // You can use targetItem.rowID directly as the parent ID
  }
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
          isDragging={isDragging}
          onDropZoneHover={onDropZoneHover}
          parentItems={[]}
          rows={data}
        />
      </div>
    </div>
  )
}

export const DivTableHeader = ({ columns }) => {
  return (
    <div className={`${baseClass}__header`}>
      {columns.map((col, index) => (
        <div className={`${baseClass}__header-cell`} key={index}>
          {col.label || col.name}
        </div>
      ))}
    </div>
  )
}

export const DivTableSection = ({
  columns,
  dragStartX,
  hoveredRowID,
  isDragging,
  isRootLeaf: _isRootLeaf = false,
  level = 0,
  onDropZoneHover,
  parentItems = [],
  rows: sectionRows,
  startZIndex = 1000,
}) => {
  /**
   * startZIndex: The z-index value for the first row at this level
   * Each subsequent row (including nested children) gets a lower z-index
   * parentItems: Array of ancestor items from root to current level
   */

  // Calculate how many rows this item and its children will render
  const countRows = (items) => {
    return items.reduce((total, item) => {
      return total + 1 + (item.children ? countRows(item.children) : 0)
    }, 0)
  }

  let currentZIndex = startZIndex

  return (
    <>
      {sectionRows.map((sectionRowItem, sectionRowIndex: number) => {
        const isLastRow = sectionRows.length - 1 === sectionRowIndex
        const hasChildren = Boolean(sectionRowItem?.children?.length)
        const isRootLeaf = level === 0 || (isLastRow && _isRootLeaf)

        // Assign z-index for this row
        const thisZIndex = currentZIndex
        currentZIndex--
        const childStartZIndex = currentZIndex

        if (hasChildren) {
          currentZIndex -= countRows(sectionRowItem.children)
        }

        const nestedParentItems = [...parentItems, sectionRowItem]

        let targetItems = []
        if (level === 0) {
          if (hasChildren) {
            targetItems = [sectionRowItem]
          }
        } else if (!isLastRow) {
          targetItems = [parentItems[parentItems.length - 1]]
        } else if (isLastRow) {
          if (hasChildren) {
            targetItems = [sectionRowItem]
          } else {
            targetItems = [...parentItems]
          }
        }

        if (isRootLeaf && !hasChildren) {
          targetItems = [null, ...targetItems]
        }

        return (
          <React.Fragment key={sectionRowIndex}>
            <div
              className={`${baseClass}__section ${hoveredRowID === sectionRowItem.rowID ? `${baseClass}__section--hovered` : ''}`}
            >
              <DraggableWithClick
                className={`${baseClass}__row`}
                key={sectionRowIndex}
                onClick={() => {}}
              >
                {columns.map((col, colIndex: number) => (
                  <div
                    className={`${baseClass}__cell`}
                    key={colIndex}
                    style={
                      col.name === 'name'
                        ? {
                            paddingLeft: level * SEGMENT_WIDTH,
                            width: '100%',
                          }
                        : undefined
                    }
                  >
                    {`${sectionRowItem[col.name] ? `${sectionRowItem[col.name]}` : `${sectionRowItem.rowID}`}`}
                  </div>
                ))}

                <div>
                  {/* row drop area */}
                  <ParentDropArea
                    dragStartX={dragStartX}
                    isDragging={isDragging}
                    onHover={onDropZoneHover}
                    parentID={sectionRowItem.rowID}
                    placement="row"
                    style={{ left: 0, width: '100%' }}
                    targetItems={[sectionRowItem]}
                  />

                  <ParentDropArea
                    dragStartX={dragStartX}
                    isDragging={isDragging}
                    markerLeftOffset={
                      isLastRow && !hasChildren
                        ? INITIAL_OFFSET + SEGMENT_WIDTH * (level - targetItems.length + 1)
                        : INITIAL_OFFSET + SEGMENT_WIDTH * (hasChildren ? level + 1 : level)
                    }
                    onHover={onDropZoneHover}
                    style={{
                      left: 0,
                      width: '100%',
                      zIndex: thisZIndex,
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
                isDragging={isDragging}
                isRootLeaf={isRootLeaf}
                level={level + 1}
                onDropZoneHover={onDropZoneHover}
                parentItems={nestedParentItems}
                rows={sectionRowItem.children}
                startZIndex={childStartZIndex}
              />
            )}
          </React.Fragment>
        )
      })}
    </>
  )
}

const ParentDropArea = ({
  dragStartX = 0,
  isDragging = false,
  markerLeftOffset = 0,
  onHover,
  placement = 'split',
  style,
  targetItems = [],
}: {
  dragStartX?: number
  isDragging?: boolean
  markerLeftOffset?: number
  onHover?: (data: { placement: 'row' | 'split'; targetItem: any }) => void
  parentID?: null | number
  placement?: 'row' | 'split'
  style: React.CSSProperties
  targetItems?: any[]
}) => {
  const id = React.useId()
  const [currentMouseX, setCurrentMouseX] = React.useState(0)

  React.useEffect(() => {
    if (!isDragging) {
      return
    }

    const handleMouseMove = (e: MouseEvent) => {
      setCurrentMouseX(e.clientX)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [isDragging])

  // Calculate horizontal offset from drag start
  const offsetFromDragStart = currentMouseX - dragStartX

  // Determine target level based on offset and initial level
  const hoverIndex = Math.max(
    Math.min(Math.round(offsetFromDragStart / 100), targetItems.length - 1),
    0,
  )

  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { parentID: hoverIndex },
  })

  const targetItem = targetItems[hoverIndex]

  React.useEffect(() => {
    if (isOver && onHover) {
      onHover({ placement, targetItem })
    }
  }, [isOver, targetItem, onHover, placement])

  const markerLeftPosition = hoverIndex * SEGMENT_WIDTH + markerLeftOffset

  return (
    <div
      className={[
        'dnd-drop-target',
        `dnd-drop-target--on-${placement}`,
        isDragging && 'is-dragging',
        isOver && 'is-over',
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
      title={`Parent: ${hoverIndex} ${id}`}
    >
      <div
        ref={setNodeRef}
        style={{
          height: '100%',
          width: '100%',
        }}
      >
        {placement === 'split' && (
          <div
            className="dnd-drop-target-split-marker"
            style={{
              left: markerLeftPosition,
            }}
          />
        )}
      </div>
    </div>
  )
}
