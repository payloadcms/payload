import React from 'react'

import { DraggableWithClick } from '../../folderView/DraggableWithClick/index.js'
import { RowDropArea } from './RowDropArea/index.js'
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

export const NestedSectionsTable = ({
  className = '',
  columns = [{ test: 'Test' }, { name: 'name' }],
  dragStartX = 0,
  isDragging = false,
  sections = exampleData,
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
          sectionRows={sections}
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
  isLastRowOfRoot: _isLastRowOfRoot = false,
  level = 0,
  onDropZoneHover,
  parentItems = [],
  sectionRows,
}) => {
  return (
    <>
      {sectionRows.map((sectionRowItem, sectionRowIndex: number) => {
        const isLastRow = sectionRows.length - 1 === sectionRowIndex
        const hasNestedSection = Boolean(sectionRowItem?.children?.length)
        const isLastRowOfRoot = level === 0 || (isLastRow && _isLastRowOfRoot)

        let targetItems = []
        if (level === 0) {
          if (hasNestedSection) {
            targetItems = [sectionRowItem]
          }
        } else if (!isLastRow) {
          targetItems = [parentItems[parentItems.length - 1]]
        } else if (isLastRow) {
          if (hasNestedSection) {
            targetItems = [sectionRowItem]
          } else {
            targetItems = [...parentItems]
          }
        }

        if (isLastRowOfRoot && !hasNestedSection) {
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
                  <RowDropArea
                    dragStartX={dragStartX}
                    isDragging={isDragging}
                    onHover={onDropZoneHover}
                    parentID={sectionRowItem.rowID}
                    placement="middle"
                    style={{ left: 0, width: '100%' }}
                    targetItems={[sectionRowItem]}
                  />

                  <RowDropArea
                    dragStartX={dragStartX}
                    isDragging={isDragging}
                    markerLeftOffset={
                      isLastRow && !hasNestedSection
                        ? INITIAL_OFFSET + SEGMENT_WIDTH * (level - targetItems.length + 1)
                        : INITIAL_OFFSET + SEGMENT_WIDTH * (hasNestedSection ? level + 1 : level)
                    }
                    onHover={onDropZoneHover}
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
                isDragging={isDragging}
                isLastRowOfRoot={isLastRowOfRoot}
                level={level + 1}
                onDropZoneHover={onDropZoneHover}
                parentItems={[...parentItems, sectionRowItem]}
                sectionRows={sectionRowItem.children}
              />
            )}
          </React.Fragment>
        )
      })}
    </>
  )
}
