'use client'
import type { ClientCollectionConfig, DefaultCellComponentProps } from 'payload'

import React from 'react'

import { useListDrawerContext } from '../../../elements/ListDrawer/Provider.js'
import { useConfig } from '../../../providers/Config/index.js'
import { DefaultCell } from '../../Table/DefaultCell/index.js'
import './index.scss'
import { useTableColumns } from '../index.js'

const baseClass = 'default-cell'

/**
 * Initial props sent from server to client - the collectionslug will then be
 * replaced by the collectionconfig on the client, so that we do not send the
 * entire collectionconfig to the client.
 */
export type InitialDefaultCellComponentProps = {
  collectionSlug: string
} & Omit<DefaultCellComponentProps, 'collectionConfig'>

const CellPropsContext = React.createContext<DefaultCellComponentProps | null>(null)

export const useCellProps = (): DefaultCellComponentProps | null =>
  React.useContext(CellPropsContext)

export const RenderDefaultCell: React.FC<{
  clientProps: InitialDefaultCellComponentProps
  columnIndex: number
  enableRowSelections?: boolean
  isLinkedColumn?: boolean
}> = ({ clientProps, columnIndex, isLinkedColumn }) => {
  const { drawerSlug, onSelect } = useListDrawerContext()
  const { LinkedCellOverride } = useTableColumns()
  const { getEntityConfig } = useConfig()

  const propsToPass: DefaultCellComponentProps = {
    ...clientProps,
    collectionConfig: getEntityConfig({
      collectionSlug: clientProps.collectionSlug,
    }) as ClientCollectionConfig,
    columnIndex,
  }
  // @ts-expect-error - part of propsToPass as we're spreading clientProps
  delete propsToPass.collectionSlug

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
