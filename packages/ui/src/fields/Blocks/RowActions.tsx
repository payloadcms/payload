'use client'
import type { ClientFieldConfig, Labels, ReducedBlock } from 'payload'

import { useModal } from '@faceless-ui/modal'
import React from 'react'

import { ArrayAction } from '../../elements/ArrayAction/index.js'
import { useDrawerSlug } from '../../elements/Drawer/useDrawerSlug.js'
import { BlocksDrawer } from './BlocksDrawer/index.js'

export const RowActions: React.FC<{
  addRow: (rowIndex: number, blockType: string) => Promise<void> | void
  blockType: string
  blocks: ReducedBlock[]
  duplicateRow: (rowIndex: number, blockType: string) => void
  fields: ClientFieldConfig[]
  hasMaxRows?: boolean
  isSortable?: boolean
  labels: Labels
  moveRow: (fromIndex: number, toIndex: number) => void
  removeRow: (rowIndex: number) => void
  rowCount: number
  rowIndex: number
}> = (props) => {
  const {
    addRow,
    blockType,
    blocks,
    duplicateRow,
    hasMaxRows,
    isSortable,
    labels,
    moveRow,
    removeRow,
    rowCount,
    rowIndex,
  } = props

  const { closeModal, openModal } = useModal()
  const drawerSlug = useDrawerSlug('blocks-drawer')

  const [indexToAdd, setIndexToAdd] = React.useState<null | number>(null)

  return (
    <React.Fragment>
      <BlocksDrawer
        addRow={(_, rowBlockType) => {
          if (typeof addRow === 'function') {
            void addRow(indexToAdd, rowBlockType)
          }
          closeModal(drawerSlug)
        }}
        addRowIndex={rowIndex}
        blocks={blocks}
        drawerSlug={drawerSlug}
        labels={labels}
      />
      <ArrayAction
        addRow={(index) => {
          setIndexToAdd(index)
          openModal(drawerSlug)
        }}
        duplicateRow={() => duplicateRow(rowIndex, blockType)}
        hasMaxRows={hasMaxRows}
        index={rowIndex}
        isSortable={isSortable}
        moveRow={moveRow}
        removeRow={removeRow}
        rowCount={rowCount}
      />
    </React.Fragment>
  )
}
