'use client'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import React, { useState } from 'react'

import type { Props as ButtonProps } from '../Button/types.js'

import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { DocumentDrawer } from '../DocumentDrawer/index.js'
import { Popup, PopupList } from '../Popup/index.js'

const baseClass = 'create-document-button'

export type CollectionOption = {
  collectionSlug: string
  /** Initial data to populate the form when creating */
  initialData?: Record<string, unknown>
  /** Optional label override (defaults to collection's singular label) */
  label?: string
}

export type CreateDocumentButtonProps = {
  /** Button style */
  buttonStyle?: ButtonProps['buttonStyle']
  /** Collections available for creation */
  collections: CollectionOption[]
  /** Unique slug for the drawer modal */
  drawerSlug: string
  /** Custom button label (defaults to "Create New" for multiple, "Create New {label}" for single) */
  label?: string
  /** Called when a document is successfully saved */
  onSave?: () => void
  /** Button size */
  size?: ButtonProps['size']
}

export function CreateDocumentButton({
  buttonStyle = 'pill',
  collections,
  drawerSlug,
  label,
  onSave,
  size = 'small',
}: CreateDocumentButtonProps) {
  const { config } = useConfig()
  const { i18n, t } = useTranslation()
  const { closeModal, openModal } = useModal()

  const [selectedCollection, setSelectedCollection] = useState<CollectionOption | null>(null)

  if (collections.length === 0) {
    return null
  }

  const getCollectionLabel = (option: CollectionOption) => {
    if (option.label) {
      return option.label
    }
    const collectionConfig = config.collections.find((c) => c.slug === option.collectionSlug)
    return getTranslation(collectionConfig?.labels?.singular, i18n) || option.collectionSlug
  }

  const handleSelect = (collection: CollectionOption) => {
    setSelectedCollection(collection)
    openModal(drawerSlug)
  }

  const handleSave = () => {
    closeModal(drawerSlug)
    onSave?.()
  }

  // Single collection - render simple button
  if (collections.length === 1) {
    const collection = collections[0]
    const buttonLabel = label || t('general:createNew')

    return (
      <>
        <Button
          buttonStyle={buttonStyle}
          className={baseClass}
          onClick={() => handleSelect(collection)}
          size={size}
        >
          {buttonLabel}
        </Button>
        {selectedCollection && (
          <DocumentDrawer
            collectionSlug={selectedCollection.collectionSlug}
            drawerSlug={drawerSlug}
            initialData={selectedCollection.initialData}
            onSave={handleSave}
            redirectAfterCreate={false}
          />
        )}
      </>
    )
  }

  // Multiple collections - render dropdown
  const buttonLabel = label || t('general:createNew')

  return (
    <>
      <Popup
        button={
          <Button
            buttonStyle={buttonStyle}
            className={`${baseClass}__popup-button`}
            icon="chevron"
            size={size}
          >
            {buttonLabel}
          </Button>
        }
        buttonType="custom"
        className={`${baseClass}__popup`}
      >
        <PopupList.ButtonGroup>
          {collections.map((collection) => (
            <PopupList.Button
              key={collection.collectionSlug}
              onClick={() => handleSelect(collection)}
            >
              {getCollectionLabel(collection)}
            </PopupList.Button>
          ))}
        </PopupList.ButtonGroup>
      </Popup>
      {selectedCollection && (
        <DocumentDrawer
          collectionSlug={selectedCollection.collectionSlug}
          drawerSlug={drawerSlug}
          initialData={selectedCollection.initialData}
          onSave={handleSave}
          redirectAfterCreate={false}
        />
      )}
    </>
  )
}
