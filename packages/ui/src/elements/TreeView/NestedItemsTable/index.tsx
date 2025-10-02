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
            // children: [
            //   {
            //     name: 'Patty',
            //     docID: 5,
            //   },
            // ],
            docID: 3,
          },
          { name: 'James Team', docID: 4 },
        ],
        docID: 2,
      },
      {
        name: 'Projects',
        docID: 7,
      },
      {
        name: 'Team',
        children: [
          { name: 'Member 1', docID: 3 },
          { name: 'Member 2', docID: 4 },
        ],
        docID: 2,
      },
    ],
    docID: 1,
  },
  { name: 'Contact', docID: 5 },
  { name: 'Docs', docID: 6 },
]

const baseClass = 'nested-items-table'
const SEGMENT_WIDTH = 30
const INITIAL_OFFSET = 36

export const NestedItemsTable = ({
  className = '',
  columns = [{ test: 'Test' }, { name: 'name' }],
  data = exampleData,
  dragStartX = 0,
  isDragging = false,
}) => {
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
          isDragging={isDragging}
          rows={data}
        />
      </div>
    </div>
  )
}

export const DivTableSection = ({
  columns,
  dragStartX,
  isDragging,
  level = 0,
  rows,
  visibleSegmentCount = 1,
}) => {
  /**
   * visibleSegmentCount: tracks how many hierarchy lines are visible for this level
   * Increments when we're a last leaf child (no more children below us)
   */
  return (
    <>
      {rows.map((item, rowIndex: number) => {
        const isLastRow = rows.length - 1 === rowIndex
        const hasChildren = item?.children?.length > 0

        // Last leaf children display visibleSegmentCount + 1, all others display visibleSegmentCount
        const actualSegments = isLastRow && !hasChildren ? visibleSegmentCount + 1 : 1

        // Pass incremented count to children if current item is last (regardless of having children)
        const childVisibleSegmentCount = isLastRow ? visibleSegmentCount + 1 : visibleSegmentCount
        return (
          <React.Fragment key={rowIndex}>
            <div
              className={`${baseClass}__section`}
              data-docID={item.docID}
              style={{
                zIndex: rows.length - rowIndex,
              }}
            >
              <DraggableWithClick className={`${baseClass}__row`} key={rowIndex} onClick={() => {}}>
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
                    {`${item[col.name] ? `lvl: ${level} ${visibleSegmentCount} ${item[col.name]} - ` : ''}${item.docID}`}
                  </div>
                ))}

                <div>
                  {/* row drop area */}
                  <ParentDropArea
                    dragStartX={dragStartX}
                    isDragging={isDragging}
                    parentID={item.docID}
                    placement="row"
                    style={{ left: 0, width: '100%' }}
                  />

                  <ParentDropArea
                    dragStartX={dragStartX}
                    isDragging={isDragging}
                    markerLeftOffset={
                      isLastRow && !hasChildren
                        ? INITIAL_OFFSET + SEGMENT_WIDTH * (level - visibleSegmentCount)
                        : INITIAL_OFFSET + SEGMENT_WIDTH * (hasChildren ? level + 1 : level)
                    }
                    style={{
                      left: 0,
                      width: '100%',
                      // zIndex: rows.length - rowIndex,
                    }}
                    totalSegments={actualSegments}
                  />
                </div>
              </DraggableWithClick>
            </div>

            {item.children && item.children.length > 0 && (
              <DivTableSection
                columns={columns}
                dragStartX={dragStartX}
                isDragging={isDragging}
                level={level + 1}
                rows={item.children}
                visibleSegmentCount={childVisibleSegmentCount}
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
  placement = 'split',
  style,
  totalSegments = 0,
}: {
  dragStartX?: number
  isDragging?: boolean
  markerLeftOffset?: number
  parentID?: null | number
  placement?: 'row' | 'split'
  style: React.CSSProperties
  totalSegments?: number
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
    Math.min(Math.round(offsetFromDragStart / SEGMENT_WIDTH), totalSegments - 1),
    0,
  )

  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { parentID: hoverIndex },
  })

  // Calculate the fixed position for the marker based on the target level
  // The marker should align with where that level's content starts
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
      data-parentID={hoverIndex}
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
