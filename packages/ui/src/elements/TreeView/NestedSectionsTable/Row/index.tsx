import React from 'react'

import type { SectionRow } from '../index.js'

import { ChevronIcon } from '../../../../icons/Chevron/index.js'
import { DragHandleIcon } from '../../../../icons/DragHandle/index.js'
import { Button } from '../../../Button/index.js'
import { DraggableWithClick } from '../../../DraggableWithClick/index.js'
import { Pill } from '../../../Pill/index.js'
import { RowDropArea } from '../RowDropArea/index.js'
import { useActionDelegation } from '../useActionDelegation.js'
import './index.scss'

const baseClass = 'nested-sections-table-row'

interface Column {
  label?: string
  name: string
}

interface DivTableRowProps {
  absoluteRowIndex: number
  columns: Column[]
  dropContextName: string
  firstCellRef?: React.RefObject<HTMLDivElement>
  firstCellWidth: number
  firstCellXOffset: number
  focusedRowIndex?: number
  hasSelectedAncestor: boolean
  hoveredRowID: null | number | string
  isDragging: boolean
  isFirstRowAtRootLevel: boolean
  isInvalidTarget: boolean
  isLastRow: boolean
  isRowAtRootLevel: boolean
  isRowSelected: boolean
  level: number
  loadingRowIDs?: Set<number | string>
  onDroppableHover: (params: {
    hoveredRowID?: number | string
    placement?: string
    targetItem: null | SectionRow
  }) => void
  onFocusChange?: (focusedIndex: number) => void
  onRowClick: ({ event, row }: { event: React.MouseEvent<HTMLElement>; row: SectionRow }) => void
  onRowDrag: (params: { event: PointerEvent; item: null | SectionRow }) => void
  onRowKeyPress?: (params: { event: React.KeyboardEvent; row: SectionRow }) => void
  openItemIDs?: Set<number | string>
  rowItem: SectionRow
  segmentWidth: number
  selectedRowIDs: (number | string)[]
  startOffset: number
  targetItems: (null | SectionRow)[]
  targetParentID: null | number | string
  toggleRow: (docID: number | string) => void
}

export const NestedSectionsTableRow: React.FC<DivTableRowProps> = ({
  absoluteRowIndex,
  columns,
  dropContextName,
  firstCellRef,
  firstCellWidth,
  firstCellXOffset,
  focusedRowIndex,
  hasSelectedAncestor,
  hoveredRowID,
  isDragging,
  isFirstRowAtRootLevel,
  isInvalidTarget,
  isRowSelected,
  level,
  loadingRowIDs,
  onDroppableHover,
  onFocusChange,
  onRowClick,
  onRowDrag,
  onRowKeyPress,
  openItemIDs,
  rowItem,
  segmentWidth,
  selectedRowIDs,
  startOffset,
  targetItems,
  targetParentID,
  toggleRow,
}) => {
  const isOdd = absoluteRowIndex % 2 === 1
  const isFocused = focusedRowIndex !== undefined && focusedRowIndex === absoluteRowIndex
  const rowRef = React.useRef<HTMLDivElement>(null)

  // Focus this row when focusedRowIndex matches
  React.useEffect(() => {
    if (focusedRowIndex !== undefined && focusedRowIndex === absoluteRowIndex) {
      rowRef.current?.focus()
    }
  }, [focusedRowIndex, absoluteRowIndex])

  const { actionNames, dataAttributeName, handleClick } = useActionDelegation({
    actions: {
      selectRow: (event) => {
        onRowClick({
          event: event as React.MouseEvent<HTMLElement>,
          row: rowItem,
        })
      },
      toggleExpand: () => {
        toggleRow(rowItem.rowID)
      },
    },
    dataAttributeName: 'data-row-action',
    disabled: hasSelectedAncestor,
  })

  return (
    <>
      <div
        className={[
          `${baseClass}__section`,
          isDragging && `${baseClass}__section--dragging`,
          isDragging && isInvalidTarget && `${baseClass}__section--invalid-target`,
          isOdd && `${baseClass}__section--odd`,
          targetParentID === rowItem.rowID && `${baseClass}__section--target`,
          isRowSelected && `${baseClass}__section--selected`,
          hasSelectedAncestor && `${baseClass}__section--selected-descendant`,
          isFocused && `${baseClass}__section--focused`,
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={handleClick}
        onFocus={(e) => {
          // Update focus index when row receives focus via tab, only if it's a valid focusable row
          // Only update if the row itself is being focused, not a child element (like the chevron button)
          if (
            focusedRowIndex !== absoluteRowIndex &&
            onFocusChange &&
            e.target === e.currentTarget
          ) {
            onFocusChange(absoluteRowIndex)
          }
        }}
        onKeyDown={
          onRowKeyPress
            ? (event) => {
                onRowKeyPress({ event, row: rowItem })
              }
            : undefined
        }
        onMouseDown={(e) => {
          // Prevent focus on mouse click to avoid the flash of focused state
          // Focus should only be triggered via keyboard navigation
          e.preventDefault()
        }}
        ref={rowRef}
        role="button"
        tabIndex={hasSelectedAncestor ? -1 : 0}
      >
        <div className={baseClass}>
          <div className={`${baseClass}__cell`} ref={firstCellRef}>
            <div className={`${baseClass}__actions`}>
              <DraggableWithClick
                attributes={{
                  tabIndex: -1,
                }}
                className={`${baseClass}__drag-handler`}
                disabled={
                  hasSelectedAncestor ||
                  (selectedRowIDs.length > 1 && !selectedRowIDs.includes(rowItem.rowID))
                }
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

          {/* Content cells - marked for row selection */}
          {columns.map((col) => (
            <div
              className={`${baseClass}__cell`}
              {...{ [dataAttributeName]: actionNames.selectRow }}
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
                      extraButtonProps={{
                        [dataAttributeName]: actionNames.toggleExpand,
                        tabIndex: hasSelectedAncestor ? -1 : 0,
                      }}
                      margin={false}
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
                  <Pill pillStyle="light-gray" size="small">
                    {`${rowItem[col.name] ? `${rowItem[col.name]}` : `!`}`}
                  </Pill>
                </span>
              ) : (
                `${rowItem[col.name] ? `${rowItem[col.name]}` : `!`}`
              )}
            </div>
          ))}

          <div>
            {/* Add split-top drop area for first root-level row */}
            {isFirstRowAtRootLevel && (
              <RowDropArea
                disabled={isInvalidTarget}
                dropContextName={dropContextName}
                isDragging={isDragging}
                onHover={(data) => {
                  onDroppableHover({ ...data, hoveredRowID: rowItem.rowID })
                }}
                placement="split-top"
                segmentWidth={segmentWidth}
                style={{
                  left: 0,
                  width: '100%',
                }}
                targetItems={[null]}
                // TODO: replace 28 with variable for padding
                xDragOffset={firstCellXOffset + firstCellWidth + 28}
                xSplitOffset={`calc(${firstCellWidth + 28}px + var(--cell-inline-padding-start))`}
              />
            )}
            {/* Add row-drop-area on row */}
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
            {/* Add split-bottom drop area on row */}
            <RowDropArea
              disabled={isInvalidTarget}
              dropContextName={dropContextName}
              isDragging={isDragging}
              onHover={(data) => {
                onDroppableHover({ ...data, hoveredRowID: rowItem.rowID })
              }}
              placement="split-bottom"
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
    </>
  )
}
