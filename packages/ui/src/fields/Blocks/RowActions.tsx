'use client'
import type { ClientBlock, ClientField, Labels } from 'payload'

import { useModal } from '@faceless-ui/modal'
import React from 'react'

import { ArrayAction } from '../../elements/ArrayAction/index.js'
import { useDrawerSlug } from '../../elements/Drawer/useDrawerSlug.js'
import { BlocksDrawer } from './BlocksDrawer/index.js'

export const RowActions: React.FC<{
  readonly addRow: (rowIndex: number, blockType: string) => Promise<void> | void
  readonly blocks: (ClientBlock | string)[]
  readonly blockType: string
  readonly duplicateRow: (rowIndex: number, blockType: string) => void
  readonly fields: ClientField[]
  readonly hasMaxRows?: boolean
  readonly isSortable?: boolean
  readonly labels: Labels
  readonly moveRow: (fromIndex: number, toIndex: number) => void
  readonly removeRow: (rowIndex: number) => void
  readonly rowCount: number
  readonly rowIndex: number
}> = (props) => {
  const {
    addRow,
    blocks,
    blockType,
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
