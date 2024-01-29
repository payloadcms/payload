'use client'
import { useModal } from '@faceless-ui/modal'
import React from 'react'

import type { Labels, RowField } from 'payload/types'

import { ArrayAction } from '../../../elements/ArrayAction'
import { useDrawerSlug } from '../../../elements/Drawer/useDrawerSlug'
import { BlocksDrawer } from './BlocksDrawer'
import { ReducedBlock, buildFieldMap } from '../../RenderFields/buildFieldMap'

export const RowActions: React.FC<{
  addRow: (rowIndex: number, blockType: string) => void
  blockType: string
  fieldMap: ReturnType<typeof buildFieldMap>
  duplicateRow: (rowIndex: number, blockType: string) => void
  hasMaxRows?: boolean
  labels: Labels
  moveRow: (fromIndex: number, toIndex: number) => void
  removeRow: (rowIndex: number) => void
  rowCount: number
  rowIndex: number
  blocks: ReducedBlock[]
}> = (props) => {
  const {
    addRow,
    blockType,
    duplicateRow,
    hasMaxRows,
    labels,
    moveRow,
    removeRow,
    rowCount,
    rowIndex,
    blocks,
  } = props

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
