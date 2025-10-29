import React from 'react'

import type { ItemKey, SectionItem } from '../types.js'

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
  absoluteIndex: number
  columns: Column[]
  dropContextName: string
  firstCellRef?: React.RefObject<HTMLDivElement>
  firstCellWidth: number
  firstCellXOffset: number
  hasSelectedAncestor: boolean
  isDragging: boolean
  isFirstRootItem: boolean
  isFocused: boolean
  isHovered: boolean
  isInvalidTarget: boolean
  isSelected: boolean
  item: SectionItem
  level: number
  loadingItemKeys: Set<ItemKey>
  onClick: (params: {
    itemKey: `${string}-${number | string}`
    options: {
      ctrlKey: boolean
      metaKey: boolean
      shiftKey: boolean
    }
  }) => void
  onDrag: (params: { event: PointerEvent; item: null | SectionItem }) => void
  onDroppableHover: (params: { hoveredItemKey?: ItemKey; targetItem: null | SectionItem }) => void
  onFocusChange: (focusedIndex: number) => void
  onKeyPress: (params: { event: React.KeyboardEvent; item: SectionItem }) => void
  openItemKeys: Set<ItemKey>
  segmentWidth: number
  selectedItemKeys: Set<ItemKey>
  startOffset: number
  targetItems: (null | SectionItem)[]
  targetParentItemKey: ItemKey | null
  toggleExpand: (docID: number | string) => void
}

export const Row: React.FC<DivTableRowProps> = ({
  absoluteIndex,
  columns,
  dropContextName,
  firstCellRef,
  firstCellWidth,
  firstCellXOffset,
  hasSelectedAncestor,
  isDragging,
  isFirstRootItem,
  isFocused,
  isHovered,
  isInvalidTarget,
  isSelected,
  item,
  level,
  loadingItemKeys,
  onClick,
  onDrag,
  onDroppableHover,
  onFocusChange,
  onKeyPress,
  openItemKeys,
  segmentWidth,
  selectedItemKeys,
  startOffset,
  targetItems,
  targetParentItemKey,
  toggleExpand,
}) => {
  const isOdd = absoluteIndex % 2 === 1
  const rowRef = React.useRef<HTMLDivElement>(null)

  // Focus this row when focusedRowIndex matches
  React.useEffect(() => {
    if (isFocused) {
      rowRef.current?.focus()
    }
  }, [isFocused])

  const { actionNames, dataAttributeName, handleClick } = useActionDelegation({
    actions: {
      onClick: (event) =>
        onClick({
          itemKey: item.itemKey,
          options: {
            ctrlKey: event.ctrlKey || event.metaKey,
            metaKey: event.ctrlKey || event.metaKey,
            shiftKey: event.shiftKey,
          },
        }),
      toggleExpand: () => toggleExpand(item.itemKey),
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
          targetParentItemKey === item.itemKey && `${baseClass}__section--target`,
          isSelected && `${baseClass}__section--selected`,
          hasSelectedAncestor && `${baseClass}__section--selected-descendant`,
          isFocused && `${baseClass}__section--focused`,
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={handleClick}
        onFocus={(e) => {
          if (e.target === e.currentTarget && !isFocused) {
            onFocusChange(absoluteIndex)
          }
        }}
        onKeyDown={(event) => {
          if (event.target === event.currentTarget) {
            onKeyPress({ event, item })
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
                    (selectedItemKeys.size > 1 && !selectedItemKeys.has(item.itemKey))
                  }
                  onDrag={(event) => {
                    onDrag({
                      event,
                      item,
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
              {...{ [dataAttributeName]: actionNames.onClick }}
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
                  {item.hasChildren || item.rows?.length ? (
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
                      {loadingItemKeys?.has(item.itemKey) ? (
                        <div className={`${baseClass}__tree-toggle-spinner`}>
                          <div className={`${baseClass}__spinner-bar`} />
                          <div className={`${baseClass}__spinner-bar`} />
                          <div className={`${baseClass}__spinner-bar`} />
                        </div>
                      ) : (
                        <ChevronIcon
                          direction={openItemKeys?.has(item.itemKey) ? 'down' : 'right'}
                        />
                      )}
                    </Button>
                  ) : (
                    <div className={`${baseClass}__tree-toggle-placeholder`} />
                  )}
                  <Pill pillStyle="light-gray" size="small">
                    {`${item[col.name] ? `${item[col.name]}` : `!`}`}
                  </Pill>
                </span>
              ) : (
                `${item[col.name] ? `${item[col.name]}` : `!`}`
              )}
            </div>
          ))}

          <div>
            {/* Add split-top drop area for first root-level row */}
            {isFirstRootItem && (
              <RowDropArea
                disabled={isInvalidTarget}
                dropContextName={dropContextName}
                isDragging={isDragging}
                onHover={(data) => {
                  onDroppableHover({ ...data, hoveredItemKey: item.itemKey })
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
                onDroppableHover({ ...data, hoveredItemKey: item.itemKey })
              }}
              placement="middle"
              segmentWidth={segmentWidth}
              style={{ left: 0, width: '100%' }}
              targetItems={[item]}
            />
            {/* Add split-bottom drop area on row */}
            <RowDropArea
              disabled={isInvalidTarget}
              dropContextName={dropContextName}
              isDragging={isDragging}
              onHover={(data) => {
                onDroppableHover({ ...data, hoveredItemKey: item.itemKey })
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
      {isDragging && isHovered && (
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
