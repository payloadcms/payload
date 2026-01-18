import type { DefaultServerCellComponentProps } from '@ruya.sa/payload'

import React from 'react'

import { FolderTableCellClient } from './index.client.js'

export const FolderTableCell = (props: DefaultServerCellComponentProps) => {
  const titleToRender =
    (props.collectionConfig.upload ? props.rowData?.filename : props.rowData?.title) ||
    props.rowData.id

  if (!props.payload.config.folders) {
    return null
  }

  return (
    <FolderTableCellClient
      collectionSlug={props.collectionSlug}
      data={props.rowData}
      docTitle={titleToRender}
      folderCollectionSlug={props.payload.config.folders.slug}
      folderFieldName={props.payload.config.folders.fieldName}
      viewType={props.viewType}
    />
  )
}
