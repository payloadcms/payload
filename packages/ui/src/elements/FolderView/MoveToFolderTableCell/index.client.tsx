'use client'

import { useRouter } from 'next/navigation.js'
import React from 'react'

import { useConfig } from '../../../providers/Config/index.js'
import { MoveDocToFolderButton } from '../MoveDocToFolder/index.js'

type Props = {
  collectionSlug: string
  data: any
  docTitle: string
}

export const FolderTableCellClient = ({ collectionSlug, data, docTitle }: Props) => {
  const { config } = useConfig()
  const router = useRouter()

  const docID = data.id

  const onConfirm = React.useCallback(
    async ({ id }) => {
      const response = await fetch(`${config.routes.api}/${collectionSlug}/${docID}`, {
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
    [config.routes.api, docID, collectionSlug, router],
  )

  return (
    <MoveDocToFolderButton
      buttonProps={{
        size: 'small',
      }}
      collectionSlug={collectionSlug}
      docData={data}
      docID={docID}
      docTitle={docTitle}
      fromFolderID={data?._folder}
      modalSlug={`move-doc-to-folder-cell--${docID}`}
      onConfirm={onConfirm}
      skipConfirmModal={false}
    />
  )
}
