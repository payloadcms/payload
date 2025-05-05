'use client'

import type { Data } from 'payload'

import React from 'react'

import { useConfig } from '../../../providers/Config/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { MoveDocToFolderButton } from '../MoveDocToFolder/index.js'

type Props = {
  collectionSlug: string
  data: Data
  docTitle: string
}

export const FolderTableCellClient = ({ collectionSlug, data, docTitle }: Props) => {
  const { config } = useConfig()
  const { t } = useTranslation()
  const [fromFolderName, setFromFolderName] = React.useState(() => `${t('general:loading')}...`)

  const docID = data.id

  const onConfirm = React.useCallback(
    async ({ id, name }) => {
      try {
        await fetch(`${config.routes.api}/${collectionSlug}/${docID}`, {
          body: JSON.stringify({
            _folder: id,
          }),
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'PATCH',
        })

        setFromFolderName(name || t('folder:noFolder'))
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error moving document to folder', error)
      }
    },
    [config.routes.api, collectionSlug, docID, t],
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
      fromFolderName={fromFolderName}
      modalSlug={`move-doc-to-folder-cell--${docID}`}
      onConfirm={onConfirm}
      skipConfirmModal={false}
    />
  )
}
