'use client'

import React from 'react'

import type { SectionRow } from '../NestedSectionsTable/index.js'

import { useTranslation } from '../../../providers/Translation/index.js'
import { useTreeView } from '../../../providers/TreeView/index.js'
import { NestedSectionsTable } from '../NestedSectionsTable/index.js'
import { documentsToSectionRows } from '../utils/documentsToSectionRows.js'
import './index.scss'

const baseClass = 'tree-view-results-table'

export function TreeViewTable() {
  const {
    checkIfItemIsDisabled,
    documents,
    dragOverlayItem,
    dragStartX,
    focusedRowIndex,
    isDragging,
    onItemClick,
    onItemDrag,
    onItemKeyPress,
    selectedItemKeys,
  } = useTreeView()
  const { i18n, t } = useTranslation()
  const [hoveredRowID, setHoveredRowID] = React.useState<null | number | string>(null)
  const [targetParentID, setTargetParentID] = React.useState<null | number | string>(null)
  const onDroppableHover = React.useCallback(
    ({
      hoveredRowID: newHoveredRowID,
      targetItem,
    }: {
      hoveredRowID?: number | string
      targetItem: null | SectionRow
    }) => {
      setHoveredRowID(newHoveredRowID || null)
      setTargetParentID(targetItem?.rowID || null)
    },
    [],
  )

  const onRowDrag = React.useCallback(
    ({ event, item }: { event: PointerEvent; item: null | SectionRow }) => {
      if (item) {
        const index = documents.findIndex((doc) => doc.value.id === item.rowID)
        if (index !== -1) {
          onItemDrag({ event, item: documents[index] })
        }
      }
    },
    [documents, onItemDrag],
  )

  const onRowClick = React.useCallback(
    ({
      event,
      from,
      row,
    }: {
      event: React.MouseEvent<HTMLElement>
      from: 'checkbox' | 'dragHandle'
      row: SectionRow
    }) => {
      const index = documents.findIndex((doc) => doc.value.id === row.rowID)
      if (index !== -1) {
        const item = documents[index]
        // const isDisabled = checkIfItemIsDisabled(item)
        // if (isDisabled) {
        //   return
        // }

        // if the user clicked the checkbox, we want to prevent the onClick event from the DraggableWithClick
        // if (from === 'checkbox' && event.type === 'click') {
        //   event.stopPropagation()
        // }

        void onItemClick({ event, index, item, keepSelected: from === 'dragHandle' })
      }
    },
    [documents, onItemClick],
  )

  const [columns] = React.useState(() => [
    {
      name: 'name',
      label: t('general:name'),
    },
    {
      name: 'updatedAt',
      label: t('general:updatedAt'),
    },
  ])

  const sections = React.useMemo(() => {
    return documentsToSectionRows({ documents, i18nLanguage: i18n.language })
  }, [documents, i18n.language])

  return (
    <NestedSectionsTable
      className={baseClass}
      draggedItem={dragOverlayItem}
      dragStartX={dragStartX}
      dropContextName="tree-view-table"
      hoveredRowID={hoveredRowID}
      isDragging={isDragging}
      onDroppableHover={onDroppableHover}
      onRowClick={onRowClick}
      onRowDrag={onRowDrag}
      sections={sections}
      selectedRowIDs={Array.from(selectedItemKeys).map((key) => {
        const doc = documents.find((d) => d.itemKey === key)
        return doc?.value.id || ''
      })}
      targetParentID={targetParentID}
      // columns={columns}
    />
  )
}
