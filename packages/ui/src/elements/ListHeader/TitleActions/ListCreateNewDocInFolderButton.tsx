'use client'

import type { ClientCollectionConfig, CollectionSlug } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import { useRouter } from 'next/navigation.js'
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
  buttonLabel,
  collectionSlugs,
  disableFolderCollection = false,
  onCreateSuccess,
}: {
  buttonLabel: string
  collectionSlugs: CollectionSlug[]
  disableFolderCollection?: boolean
  onCreateSuccess?: (doc: any) => Promise<void> | void
}) {
  const { i18n } = useTranslation()
  const { closeModal, openModal } = useModal()
  const { config } = useConfig()
  const router = useRouter()
  const { folderCollectionConfig, folderID } = useFolder()
  const [createCollectionSlug, setCreateCollectionSlug] = React.useState<string | undefined>()
  const [enabledCollections] = React.useState<ClientCollectionConfig[]>(() =>
    config.collections.filter(({ slug }) => {
      return collectionSlugs.includes(slug) && config.folders.collections[slug]
    }),
  )

  if (disableFolderCollection && enabledCollections.length === 0) {
    return null
  }

  return (
    <React.Fragment>
      {(disableFolderCollection && enabledCollections.length === 1) ||
      (!disableFolderCollection && enabledCollections.length === 0) ? (
        // If there is only 1 option, do not render a popup
        <Button
          buttonStyle="pill"
          className={`${baseClass}__button`}
          el="div"
          onClick={() => {
            if (!disableFolderCollection) {
              openModal(newFolderDrawerSlug)
            } else {
              setCreateCollectionSlug(enabledCollections[0].slug)
              openModal(newDocInFolderDrawerSlug)
            }
          }}
          size="small"
        >
          {buttonLabel}
        </Button>
      ) : (
        <Popup
          button={
            <Button
              buttonStyle="pill"
              className={`${baseClass}__popup-button`}
              el="div"
              icon="chevron"
              size="small"
            >
              {buttonLabel}
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
            {enabledCollections.map((collection, index) => {
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
            })}
          </PopupList.ButtonGroup>
        </Popup>
      )}

      {createCollectionSlug && (
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
              router.refresh()
            }
          }}
          redirectAfterCreate={false}
        />
      )}

      {!disableFolderCollection && (
        <NewFolderDrawer
          drawerSlug={newFolderDrawerSlug}
          onNewFolderSuccess={(doc) => {
            closeModal(newFolderDrawerSlug)
            if (typeof onCreateSuccess === 'function') {
              void onCreateSuccess(doc)
            }
          }}
        />
      )}
    </React.Fragment>
  )
}
