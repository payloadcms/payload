'use client'

import type { DefaultCellComponentProps } from 'payload'

import { useRouter } from 'next/navigation.js'
import React from 'react'

import { useConfig } from '../../../providers/Config/index.js'
import { MoveDocToFolderButton } from './index.js'

export const FolderTableCell = (props: DefaultCellComponentProps) => {
  const { config } = useConfig()
  const router = useRouter()

  const docID = props.rowData.id

  const onConfirm = React.useCallback(
    async ({ id }) => {
      const response = await fetch(`${config.routes.api}/${props.collectionSlug}/${docID}`, {
        body: JSON.stringify({
          _folder: id,
        }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
      })
      if (response.ok) {
        router.refresh()
      } else {
        // handle error
        console.error('Error moving document to folder:', response.statusText)
      }
    },
    [config.routes.api, docID, props.collectionSlug, router],
  )

  return (
    <MoveDocToFolderButton
      buttonProps={{
        size: 'small',
      }}
      collectionSlug={props.collectionSlug}
      docData={props.rowData}
      docID={docID}
      docTitle={props.rowData.title}
      fromFolderID={props.rowData?._folder}
      modalSlug={`move-doc-to-folder-cell--${docID}`}
      onConfirm={onConfirm}
      skipConfirmModal={false}
    />
  )
}
