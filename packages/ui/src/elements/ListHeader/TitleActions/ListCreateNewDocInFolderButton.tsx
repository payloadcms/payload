'use client'

import type { ClientCollectionConfig, CollectionSlug } from 'payload'

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

const baseClass = 'create-new-doc-in-folder'

export function ListCreateNewDocInFolderButton({
  buttonLabel,
  collectionSlugs,
  onCreateSuccess,
  slugPrefix,
}: {
  buttonLabel: string
  collectionSlugs: CollectionSlug[]
  onCreateSuccess: (args: {
    collectionSlug: CollectionSlug
    doc: Record<string, unknown>
  }) => Promise<void> | void
  slugPrefix: string
}) {
  const newFolderDrawerSlug = `${slugPrefix}-new-folder-drawer`
  const newDocInFolderDrawerSlug = `${slugPrefix}-new-doc-in-folder-drawer`
  const { i18n } = useTranslation()
  const { closeModal, openModal } = useModal()
  const { config } = useConfig()
  const { folderCollectionConfig, folderID } = useFolder()
  const [createCollectionSlug, setCreateCollectionSlug] = React.useState<string | undefined>()
  const [enabledCollections] = React.useState<ClientCollectionConfig[]>(() =>
    collectionSlugs.reduce((acc, collectionSlug) => {
      const collectionConfig = config.collections.find(({ slug }) => slug === collectionSlug)
      if (collectionConfig) {
        acc.push(collectionConfig)
      }
      return acc
    }, []),
  )

  if (enabledCollections.length === 0) {
    return null
  }

  return (
    <React.Fragment>
      {enabledCollections.length === 1 ? (
        // If there is only 1 option, do not render a popup
        <Button
          buttonStyle="pill"
          className={`${baseClass}__button`}
          el="div"
          onClick={() => {
            if (enabledCollections[0].slug === folderCollectionConfig.slug) {
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
            {enabledCollections.map((collection, index) => {
              return (
                <PopupList.Button
                  key={index}
                  onClick={() => {
                    if (collection.slug === folderCollectionConfig.slug) {
                      openModal(newFolderDrawerSlug)
                    } else {
                      setCreateCollectionSlug(collection.slug)
                      openModal(newDocInFolderDrawerSlug)
                    }
                  }}
                >
                  {getTranslation(collection.labels.singular, i18n)}
                </PopupList.Button>
              )
            })}
          </PopupList.ButtonGroup>
        </Popup>
      )}

      {createCollectionSlug && (
        <DocumentDrawer
          collectionSlug={createCollectionSlug}
          drawerSlug={newDocInFolderDrawerSlug}
          initialData={{
            [config.folders.fieldName]: folderID,
          }}
          onSave={({ doc }) => {
            closeModal(newDocInFolderDrawerSlug)
            void onCreateSuccess({
              collectionSlug: createCollectionSlug,
              doc,
            })
          }}
          redirectAfterCreate={false}
        />
      )}

      {collectionSlugs.includes(folderCollectionConfig.slug) && (
        <NewFolderDrawer
          drawerSlug={newFolderDrawerSlug}
          onNewFolderSuccess={(doc) => {
            closeModal(newFolderDrawerSlug)
            if (typeof onCreateSuccess === 'function') {
              void onCreateSuccess({
                collectionSlug: folderCollectionConfig.slug,
                doc,
              })
            }
          }}
        />
      )}
    </React.Fragment>
  )
}
