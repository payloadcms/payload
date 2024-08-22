'use client'
import type { CellComponentProps } from 'payload'

import React from 'react'

import { EditIcon } from '../../../../icons/Edit/index.js'
import { useDocumentDrawer } from '../../../DocumentDrawer/index.js'
import { DefaultCell } from '../../../Table/DefaultCell/index.js'
import { useTableCell } from '../../../Table/index.js'
import './index.scss'

export const DrawerLink: React.FC<CellComponentProps> = (props) => {
  const context = useTableCell()
  const { field } = props

  const {
    cellProps,
    customCellContext: { collectionSlug },
    rowData,
  } = context

  const [DocumentDrawer, DocumentDrawerToggler] = useDocumentDrawer({
    id: rowData.id,
    collectionSlug,
  })

  return (
    <div className="drawer-link">
      <DefaultCell field={field} {...cellProps} className="drawer-link__cell" />
      <DocumentDrawerToggler>
        <EditIcon />
      </DocumentDrawerToggler>
      <DocumentDrawer />
    </div>
  )
}
