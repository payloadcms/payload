'use client'
import type { Labels } from 'payload/types'

import * as facelessUIImport from '@faceless-ui/modal'
import React from 'react'

import type {
  FieldMap,
  ReducedBlock,
} from '../../providers/ComponentMap/buildComponentMap/types.js'

import { ArrayAction } from '../../elements/ArrayAction/index.js'
import { useDrawerSlug } from '../../elements/Drawer/useDrawerSlug.js'
import { BlocksDrawer } from './BlocksDrawer/index.js'

export const RowActions: React.FC<{
  addRow: (rowIndex: number, blockType: string) => void
  blockType: string
  blocks: ReducedBlock[]
  disableSortable?: boolean
  duplicateRow: (rowIndex: number, blockType: string) => void
  fieldMap: FieldMap
  hasMaxRows?: boolean
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
    disableSortable,
    duplicateRow,
    hasMaxRows,
    labels,
    moveRow,
    removeRow,
    rowCount,
    rowIndex,
  } = props
  const { useModal } = facelessUIImport

  const { closeModal, openModal } = useModal()
  const drawerSlug = useDrawerSlug('blocks-drawer')

  const [indexToAdd, setIndexToAdd] = React.useState<null | number>(null)

  return (
    <React.Fragment>
      <BlocksDrawer
        addRow={(_, rowBlockType) => {
          if (typeof addRow === 'function') {
            addRow(indexToAdd, rowBlockType)
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
        disableSortable={disableSortable}
        duplicateRow={() => duplicateRow(rowIndex, blockType)}
        hasMaxRows={hasMaxRows}
        index={rowIndex}
        moveRow={moveRow}
        removeRow={removeRow}
        rowCount={rowCount}
      />
    </React.Fragment>
  )
}
