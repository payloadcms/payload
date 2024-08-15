'use client'

import { EditIcon, useDocumentDrawer, useTableCell } from '@payloadcms/ui'

export const MyCell = (props) => {
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
