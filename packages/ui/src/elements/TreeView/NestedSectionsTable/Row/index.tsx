import React from 'react'

import type { ItemKey, SectionRow } from '../types.js'

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
  hoveredRowItemKey: ItemKey | null
  isDragging: boolean
  isFirstRowAtRootLevel: boolean
  isInvalidTarget: boolean
  isLastRow: boolean
  isRowAtRootLevel: boolean
  isRowSelected: boolean
  level: number
  loadingRowItemKeys?: Set<ItemKey>
  onDroppableHover: (params: {
    hoveredRowID?: ItemKey
    placement?: string
    targetItem: null | SectionRow
  }) => void
  onFocusChange: (focusedIndex: number) => void
  onRowDrag: (params: { event: PointerEvent; item: null | SectionRow }) => void
  onRowKeyPress: (params: { event: React.KeyboardEvent; row: SectionRow }) => void
  onSelectionChange: (params: {
    itemKey: `${string}-${number | string}`
    options: {
      ctrlKey: boolean
      metaKey: boolean
      shiftKey: boolean
    }
  }) => void
  openItemKeys?: Set<ItemKey>
  rowItem: SectionRow
  segmentWidth: number
  selectedItemKeys: Set<ItemKey>
  startOffset: number
  targetItems: (null | SectionRow)[]
  targetParentID: null | number | string
  toggleRowExpand: (docID: number | string) => void
}

export const Row: React.FC<DivTableRowProps> = ({
  absoluteRowIndex,
  columns,
  dropContextName,
  firstCellRef,
  firstCellWidth,
  firstCellXOffset,
  focusedRowIndex,
  hasSelectedAncestor,
  hoveredRowItemKey,
  isDragging,
  isFirstRowAtRootLevel,
  isInvalidTarget,
  isRowSelected,
  level,
  loadingRowItemKeys: loadingRowIDs,
  onDroppableHover,
  onFocusChange,
  onRowDrag,
  onRowKeyPress,
  onSelectionChange,
  openItemKeys,
  rowItem,
  segmentWidth,
  selectedItemKeys,
  startOffset,
  targetItems,
  targetParentID,
  toggleRowExpand: toggleRow,
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
        onSelectionChange({
          itemKey: rowItem.rowID,
          options: {
            ctrlKey: event.ctrlKey || event.metaKey,
            metaKey: event.ctrlKey || event.metaKey,
            shiftKey: event.shiftKey,
          },
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
          if (e.target === e.currentTarget && focusedRowIndex !== absoluteRowIndex) {
            onFocusChange(absoluteRowIndex)
          }
        }}
        onKeyDown={(event) => {
          if (event.target === event.currentTarget) {
            onRowKeyPress({ event, row: rowItem })
          }
        }}
        onMouseDown={(e) => {
          e.preventDefault()
        }}
        ref={rowRef}
        role="button"
        tabIndex={hasSelectedAncestor ? -1 : 0}
      >
        <div className={baseClass}>
          <div className={`${baseClass}__cell`} ref={firstCellRef}>
            <div className={`${baseClass}__actions`}>
              {!hasSelectedAncestor ? (
                <DraggableWithClick
                  attributes={{
                    tabIndex: -1,
                  }}
                  className={`${baseClass}__drag-handler`}
                  disabled={
                    hasSelectedAncestor ||
                    (selectedItemKeys.size > 1 && !selectedItemKeys.has(rowItem.rowID))
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
              ) : null}
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
                          direction={openItemKeys?.has(rowItem.rowID) ? 'down' : 'right'}
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
      {isDragging && hoveredRowItemKey === rowItem.rowID && (
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
