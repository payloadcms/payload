'use client'

import type { ClientCollectionConfig, CollectionSlug } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import { useConfig } from '../../../providers/Config/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import { Popup, PopupList } from '../../Popup/index.js'

const baseClass = 'create-new-doc-in-folder'

export function ListCreateNewDocInFolderButton({
  buttonLabel,
  buttonSize = 'small',
  buttonStyle = 'pill',
  collectionSlugs,
  onRequestCreate,
}: {
  buttonLabel: string
  buttonSize?: 'large' | 'medium' | 'small' | 'xsmall'
  buttonStyle?:
    | 'error'
    | 'icon-label'
    | 'none'
    | 'pill'
    | 'primary'
    | 'secondary'
    | 'subtle'
    | 'tab'
    | 'transparent'
  collectionSlugs: CollectionSlug[]
  onRequestCreate: (collectionSlug: CollectionSlug) => void
}) {
  const { i18n } = useTranslation()
  const { config } = useConfig()
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
          buttonStyle={buttonStyle}
          className={`${baseClass}__button`}
          el="div"
          onClick={() => onRequestCreate(enabledCollections[0].slug)}
          size={buttonSize}
        >
          {buttonLabel}
        </Button>
      ) : (
        <Popup
          button={
            <Button
              buttonStyle={buttonStyle}
              className={`${baseClass}__popup-button`}
              el="div"
              icon="chevron"
              size={buttonSize}
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
                <PopupList.Button key={index} onClick={() => onRequestCreate(collection.slug)}>
                  {getTranslation(collection.labels.singular, i18n)}
                </PopupList.Button>
              )
            })}
          </PopupList.ButtonGroup>
        </Popup>
      )}
    </React.Fragment>
  )
}
