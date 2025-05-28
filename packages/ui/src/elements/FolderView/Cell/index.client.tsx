'use client'

import type { Data } from 'payload'
import type { FolderOrDocument } from 'payload/shared'

import React, { useEffect } from 'react'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { MoveDocToFolderButton, useConfig, useTranslation } from '../../../exports/client/index.js'

type Props = {
  collectionSlug: string
  data: Data
  docTitle: string
  folderFieldName: string
}

export const FolderTableCellClient = ({
  collectionSlug,
  data,
  docTitle,
  folderFieldName,
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
        await fetch(`${config.routes.api}/${collectionSlug}/${docID}`, {
          body: JSON.stringify({
            [folderFieldName]: id,
          }),
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'PATCH',
        })

        setFromFolderID(id)
        setFromFolderName(name || t('folder:noFolder'))
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error moving document to folder', error)
      }
    },
    [config.routes.api, collectionSlug, docID, t],
  )

  useEffect(() => {
    const loadFolderName = async () => {
      try {
        const req = await fetch(
          `${config.routes.api}/${config.folders.slug}${intialFolderID ? `/${intialFolderID}` : ''}`,
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
  }, [])

  return (
    <MoveDocToFolderButton
      buttonProps={{
        size: 'small',
      }}
      collectionSlug={collectionSlug}
      docData={data as FolderOrDocument['value']}
      docID={docID}
      docTitle={docTitle}
      fromFolderID={fromFolderID}
      fromFolderName={fromFolderName}
      modalSlug={`move-doc-to-folder-cell--${docID}`}
      onConfirm={onConfirm}
      skipConfirmModal={false}
    />
  )
}
