'use client'

import type { CollectionSlug } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import { useConfig } from '../../../providers/Config/index.js'
import { useFolder } from '../../../providers/Folders/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import { DocumentDrawer } from '../../DocumentDrawer/index.js'
import { NewFolderDrawer } from '../../FolderView/Drawers/NewFolder/index.js'
import { Popup, PopupList } from '../../Popup/index.js'

const newFolderDrawerSlug = 'create-new-folder'
const newDocInFolderDrawerSlug = 'create-new-document-with-folder'
const baseClass = 'create-new-doc-in-folder'

export function ListCreateNewDocInFolderButton({
  collectionSlugs,
}: {
  collectionSlugs: CollectionSlug[]
}) {
  const { i18n, t } = useTranslation()
  const { closeModal, openModal } = useModal()
  const { config } = useConfig()
  const { folderCollectionConfig, folderID, populateFolderData, setSubfolders } = useFolder()
  const [createCollectionSlug, setCreateCollectionSlug] = React.useState<string | undefined>()

  const onNewFolderCreate = React.useCallback(
    async (doc) => {
      setSubfolders((prev) => {
        return [
          ...prev,
          {
            relationTo: config.folders.slug,
            value: doc,
          },
        ]
      })
      await populateFolderData({ folderID })
      closeModal(newFolderDrawerSlug)
    },
    [config.folders.slug, folderID, populateFolderData, setSubfolders, closeModal],
  )

  return (
    <React.Fragment>
      <Popup
        button={
          <Button
            buttonStyle="pill"
            className={`${baseClass}__popup-button`}
            el="div"
            icon="chevron"
            size="small"
          >
            {t('general:createNew')}
          </Button>
        }
        buttonType="default"
        className={`${baseClass}__action-popup`}
      >
        <PopupList.ButtonGroup>
          <PopupList.Button
            onClick={() => {
              openModal(newFolderDrawerSlug)
            }}
          >
            {getTranslation(folderCollectionConfig.labels.singular, i18n)}
          </PopupList.Button>
          {config.collections.map((collection, index) => {
            if (
              config.folders.collections[collection.slug] &&
              collectionSlugs.includes(collection.slug)
            ) {
              const label =
                typeof collection.labels.singular === 'string'
                  ? collection.labels.singular
                  : collection.slug
              return (
                <PopupList.Button
                  key={index}
                  onClick={() => {
                    setCreateCollectionSlug(collection.slug)
                    openModal(newDocInFolderDrawerSlug)
                  }}
                >
                  {label}
                </PopupList.Button>
              )
            }
            return null
          })}
        </PopupList.ButtonGroup>
      </Popup>

      <DocumentDrawer
        collectionSlug={createCollectionSlug}
        drawerSlug="create-new-document-with-folder"
        initialData={{
          _parentFolder: folderID,
        }}
        onSave={({ operation }) => {
          if (operation === 'create') {
            closeModal(newDocInFolderDrawerSlug)
            setCreateCollectionSlug(undefined)
            void populateFolderData({ folderID })
          }
        }}
        redirectAfterCreate={false}
      />

      <NewFolderDrawer drawerSlug={newFolderDrawerSlug} onNewFolderSuccess={onNewFolderCreate} />
    </React.Fragment>
  )
}
