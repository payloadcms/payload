import type { DefaultServerCellComponentProps } from 'payload'

import React from 'react'

import { FolderTableCellClient } from './index.client.js'

export const FolderTableCell = (props: DefaultServerCellComponentProps) => {
  const titleToRender =
    (props.collectionConfig.upload ? props.rowData?.filename : props.rowData?.title) ||
    props.rowData.id

  return (
    <FolderTableCellClient
      collectionSlug={props.collectionSlug}
      data={props.rowData}
      docTitle={titleToRender}
      folderFieldName={props.payload.config.folders.fieldName}
    />
  )
}
