'use client'
import type { CellComponentProps } from 'payload'

import React from 'react'

import { EditIcon } from '../../../icons/Edit/index.js'
import { useDocumentDrawer } from '../../DocumentDrawer/index.js'
import { useTableCell } from '../../Table/index.js'

export const DrawerLink: React.FC<CellComponentProps> = (props) => {
  const context = useTableCell()

  const {
    customCellContext: { collectionSlug },
    rowData,
  } = context

  const [DocumentDrawer, DocumentDrawerToggler] = useDocumentDrawer({
    id: rowData.id,
    collectionSlug,
  })

  return (
    <div>
      {rowData.id}
      &nbsp;
      <DocumentDrawerToggler>
        <EditIcon />
      </DocumentDrawerToggler>
      <DocumentDrawer />
    </div>
  )
}
