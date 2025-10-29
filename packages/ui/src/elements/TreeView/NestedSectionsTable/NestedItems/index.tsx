import React from 'react'

import type { Column, ItemKey, SectionItem } from '../types.js'

import { Row } from '../Row/index.js'

interface ItemWithChildrenProps {
  columns: Column[]
  dropContextName: string
  firstCellRef?: React.RefObject<HTMLDivElement>
  firstCellWidth: number
  firstCellXOffset: number
  focusedItemIndex?: number
  hasSelectedAncestor?: boolean
  hoveredItemKey: ItemKey | null
  isDragging: boolean
  isLastItemOfRoot?: boolean
  items: SectionItem[]
  level?: number
  loadingItemKeys?: Set<ItemKey>
  onDroppableHover: (params: {
    hoveredItemKey?: ItemKey
    placement?: string
    targetItem: null | SectionItem
  }) => void
  onFocusChange: (focusedIndex: number) => void
  onItemDrag: (params: { event: PointerEvent; item: null | SectionItem }) => void
  onItemKeyPress: (params: { event: React.KeyboardEvent; item: SectionItem }) => void
  onSelectionChange: ({
    itemKey,
    options,
  }: {
    itemKey: ItemKey
    options: {
      ctrlKey: boolean
      metaKey: boolean
      shiftKey: boolean
    }
  }) => void
  openItemKeys?: Set<ItemKey>
  parentIndex?: number
  parentItems?: SectionItem[]
  segmentWidth: number
  selectedItemKeys?: Set<ItemKey>
  targetParentItemKey: ItemKey | null
  toggleItemExpand: (itemKey: ItemKey) => void
}

export const NestedItems: React.FC<ItemWithChildrenProps> = ({
  columns,
  dropContextName,
  firstCellRef,
  firstCellWidth,
  firstCellXOffset,
  focusedItemIndex,
  hasSelectedAncestor = false,
  hoveredItemKey,
  isDragging,
  isLastItemOfRoot = false,
  items,
  level = 0,
  loadingItemKeys,
  onDroppableHover,
  onFocusChange,
  onItemDrag,
  onItemKeyPress,
  onSelectionChange,
  openItemKeys,
  parentIndex = 0,
  parentItems = [],
  segmentWidth,
  selectedItemKeys = new Set<ItemKey>(),
  targetParentItemKey,
  toggleItemExpand,
}) => {
  // Helper to count all rows recursively, only counting visible (open) rows
  const countItems = (items: SectionItem[]): number => {
    return items.reduce((count, item) => {
      const isOpen = openItemKeys?.has(item.itemKey)
      return count + 1 + (item.rows && isOpen ? countItems(item.rows) : 0)
    }, 0)
  }

  // Calculate absolute row index for each row before render
  const getAbsoluteItemIndex = (index: number): number => {
    let offset = parentIndex
    for (let i = 0; i < index; i++) {
      offset += 1
      const isOpen = openItemKeys?.has(items[i].itemKey)
      if (items[i].rows && isOpen) {
        offset += countItems(items[i].rows || [])
      }
    }
    return offset
  }

  return (
    <>
      {items.map((sectionItem, sectionItemIndex: number) => {
        const absoluteItemIndex = getAbsoluteItemIndex(sectionItemIndex)
        const isLastSiblingItem = items.length - 1 === sectionItemIndex
        const hasNestedItems =
          Boolean(sectionItem?.rows?.length) && openItemKeys?.has(sectionItem.itemKey)

        const isItemSelected = selectedItemKeys.has(sectionItem.itemKey)
        const isInvalidTarget = hasSelectedAncestor || isItemSelected
        const isItemAtRootLevel = level === 0 || (isLastSiblingItem && isLastItemOfRoot)
        const isFirstItemAtRootLevel = level === 0 && sectionItemIndex === 0

        // Calculate drop target items based on position in hierarchy
        let targetItems: (null | SectionItem)[] = []

        if (level === 0) {
          targetItems = hasNestedItems ? [sectionItem] : []
        } else if (isLastSiblingItem) {
          targetItems = hasNestedItems
            ? [sectionItem]
            : isItemAtRootLevel
              ? [...parentItems]
              : [parentItems[parentItems.length - 2], parentItems[parentItems.length - 1]].filter(
                  Boolean,
                )
        } else {
          targetItems = hasNestedItems ? [sectionItem] : [parentItems[parentItems.length - 1]]
        }

        // Allow dropping at root level for last item without nested items
        if (isItemAtRootLevel && !hasNestedItems) {
          targetItems = [null, ...targetItems]
        }

        const startOffset =
          isLastSiblingItem && !hasNestedItems
            ? firstCellWidth + segmentWidth * (level - targetItems.length + 1) + 28
            : firstCellWidth + segmentWidth * (hasNestedItems ? level + 1 : level) + 28

        return (
          <React.Fragment key={sectionItem.itemKey}>
            <Row
              absoluteIndex={absoluteItemIndex}
              columns={columns}
              dropContextName={dropContextName}
              firstCellRef={level === 0 && sectionItemIndex === 0 ? firstCellRef : undefined}
              firstCellWidth={firstCellWidth}
              firstCellXOffset={firstCellXOffset}
              hasSelectedAncestor={hasSelectedAncestor}
              isDragging={isDragging}
              isFirstRootItem={isFirstItemAtRootLevel}
              isFocused={focusedItemIndex !== undefined && focusedItemIndex === absoluteItemIndex}
              isHovered={hoveredItemKey === sectionItem.itemKey}
              isInvalidTarget={isInvalidTarget}
              isSelected={isItemSelected}
              item={sectionItem}
              level={level}
              loadingItemKeys={loadingItemKeys}
              onClick={onSelectionChange}
              onDrag={onItemDrag}
              onDroppableHover={onDroppableHover}
              onFocusChange={onFocusChange}
              onKeyPress={onItemKeyPress}
              openItemKeys={openItemKeys}
              segmentWidth={segmentWidth}
              selectedItemKeys={selectedItemKeys}
              startOffset={startOffset}
              targetItems={targetItems}
              targetParentItemKey={targetParentItemKey}
              toggleExpand={toggleItemExpand}
            />

            {hasNestedItems && sectionItem.rows && (
              <NestedItems
                columns={columns}
                dropContextName={dropContextName}
                firstCellWidth={firstCellWidth}
                firstCellXOffset={firstCellXOffset}
                focusedItemIndex={focusedItemIndex}
                hasSelectedAncestor={hasSelectedAncestor || isItemSelected}
                hoveredItemKey={hoveredItemKey}
                isDragging={isDragging}
                isLastItemOfRoot={isItemAtRootLevel}
                items={sectionItem.rows}
                level={level + 1}
                loadingItemKeys={loadingItemKeys}
                onDroppableHover={onDroppableHover}
                onFocusChange={onFocusChange}
                onItemDrag={onItemDrag}
                onItemKeyPress={onItemKeyPress}
                onSelectionChange={onSelectionChange}
                openItemKeys={openItemKeys}
                parentIndex={absoluteItemIndex + 1}
                parentItems={[...parentItems, sectionItem]}
                segmentWidth={segmentWidth}
                selectedItemKeys={selectedItemKeys}
                targetParentItemKey={targetParentItemKey}
                toggleItemExpand={toggleItemExpand}
              />
            )}
          </React.Fragment>
        )
      })}
    </>
  )
}
