'use client'
import type { DefaultCellComponentProps } from 'payload'

import React from 'react'

import { useListDrawerContext } from '../../../elements/ListDrawer/Provider.js'
import { DefaultCell } from '../../Table/DefaultCell/index.js'
import './index.scss'
import { useTableColumns } from '../index.js'

const baseClass = 'default-cell'

const CellPropsContext = React.createContext<DefaultCellComponentProps | null>(null)

export const useCellProps = (): DefaultCellComponentProps | null =>
  React.useContext(CellPropsContext)

export const RenderDefaultCell: React.FC<{
  clientProps: DefaultCellComponentProps
  columnIndex: number
  enableRowSelections?: boolean
  isLinkedColumn?: boolean
}> = ({ clientProps, columnIndex, isLinkedColumn }) => {
  const { drawerSlug, onSelect } = useListDrawerContext()
  const { LinkedCellOverride } = useTableColumns()

  const propsToPass: DefaultCellComponentProps = {
    ...clientProps,
    columnIndex,
  }

  if (isLinkedColumn && drawerSlug) {
    propsToPass.className = `${baseClass}__first-cell`
    propsToPass.link = false
    propsToPass.onClick = ({ collectionSlug: rowColl, rowData }) => {
      if (typeof onSelect === 'function') {
        onSelect({
          collectionSlug: rowColl,
          docID: rowData.id as string,
        })
      }
    }
  }

  return (
    <CellPropsContext.Provider value={propsToPass}>
      {isLinkedColumn && LinkedCellOverride ? LinkedCellOverride : <DefaultCell {...propsToPass} />}
    </CellPropsContext.Provider>
  )
}
