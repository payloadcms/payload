'use client'

import type { Data, ViewTypes } from 'payload'
import type { FolderOrDocument } from 'payload/shared'

import { formatAdminURL } from 'payload/shared'
import React, { useEffect } from 'react'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { MoveDocToFolderButton, useConfig, useTranslation } from '../../../exports/client/index.js'

type Props = {
  readonly collectionSlug: string
  readonly data: Data
  readonly docTitle: string
  readonly folderCollectionSlug: string
  readonly folderFieldName: string
  readonly viewType?: ViewTypes
}

export const FolderTableCellClient = ({
  collectionSlug,
  data,
  docTitle,
  folderCollectionSlug,
  folderFieldName,
  viewType,
}: Props) => {
  const docID = data.id
  const intialFolderID = data?.[folderFieldName]

  const { config } = useConfig()
  const { t } = useTranslation()
  const [fromFolderName, setFromFolderName] = React.useState(() =>
    intialFolderID ? `${t('general:loading')}...` : t('folder:noFolder'),
  )
  const [fromFolderID, setFromFolderID] = React.useState(intialFolderID)

  const hasLoadedFolderName = React.useRef(false)

  const onConfirm = React.useCallback(
    async ({ id, name }) => {
      try {
        await fetch(
          formatAdminURL({
            apiRoute: config.routes.api,
            path: `/${collectionSlug}/${docID}`,
          }),
          {
            body: JSON.stringify({
              [folderFieldName]: id,
            }),
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'PATCH',
          },
        )

        setFromFolderID(id)
        setFromFolderName(name || t('folder:noFolder'))
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error moving document to folder', error)
      }
    },
    [config.routes.api, collectionSlug, docID, folderFieldName, t],
  )

  useEffect(() => {
    const loadFolderName = async () => {
      try {
        const req = await fetch(
          formatAdminURL({
            apiRoute: config.routes.api,
            path: `/${folderCollectionSlug}${intialFolderID ? `/${intialFolderID}` : ''}`,
          }),
          {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'GET',
          },
        )

        const res = await req.json()
        setFromFolderName(res?.name || t('folder:noFolder'))
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error moving document to folder', error)
      }
    }

    if (!hasLoadedFolderName.current) {
      void loadFolderName()
      hasLoadedFolderName.current = true
    }
  }, [config.routes.api, folderCollectionSlug, intialFolderID, t])

  return (
    <MoveDocToFolderButton
      buttonProps={{
        disabled: viewType === 'trash',
        size: 'small',
      }}
      collectionSlug={collectionSlug}
      docData={data as FolderOrDocument['value']}
      docID={docID}
      docTitle={docTitle}
      folderCollectionSlug={folderCollectionSlug}
      folderFieldName={folderFieldName}
      fromFolderID={fromFolderID}
      fromFolderName={fromFolderName}
      modalSlug={`move-doc-to-folder-cell--${docID}`}
      onConfirm={onConfirm}
      skipConfirmModal={false}
    />
  )
}
