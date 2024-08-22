'use client'
import type { CellComponentProps } from 'payload'

import React from 'react'

import { EditIcon } from '../../icons/Edit/index.js'
import { useDocumentDrawer } from '../DocumentDrawer/index.js'
import { useTableCell } from '../Table/index.js'

export const MyCell: React.FC<CellComponentProps> = (props) => {
  const context = useTableCell()

  const {
    customCellContext: { collectionSlug },
    rowData,
  } = context

  const [DocumentDrawer, DocumentDrawerToggler] = useDocumentDrawer({
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
