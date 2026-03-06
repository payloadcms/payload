'use client'

import type { ClientCollectionConfig, ClientConfig, ViewTypes } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { useRouter } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import { usePreferences } from '../../providers/Preferences/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import './index.scss'

const baseClass = 'default-list-view-tabs'

type DefaultListViewTabsProps = {
  collectionConfig: ClientCollectionConfig
  config: ClientConfig
  onChange?: (viewType: ViewTypes) => void
  viewType?: ViewTypes
}

export const DefaultListViewTabs: React.FC<DefaultListViewTabsProps> = ({
  collectionConfig,
  config,
  onChange,
  viewType,
}) => {
  const { i18n, t } = useTranslation()
  const { setPreference } = usePreferences()
  const router = useRouter()
  const isTrashEnabled = collectionConfig.trash
  const isFoldersEnabled = collectionConfig.folders && config.folders

  if (!isTrashEnabled && !isFoldersEnabled) {
    return null
  }

  const handleViewChange = async (newViewType: ViewTypes) => {
    if (onChange) {
      onChange(newViewType)
    }

    if (newViewType === 'list' || newViewType === 'folders') {
      await setPreference(`collection-${collectionConfig.slug}`, {
        listViewType: newViewType,
      })
    }

    let path: `/${string}` = `/collections/${collectionConfig.slug}`
    switch (newViewType) {
      case 'folders':
        if (config.folders) {
          path = `/collections/${collectionConfig.slug}/${config.folders.slug}`
        }
        break
      case 'trash':
        path = `/collections/${collectionConfig.slug}/trash`
        break
    }

    const url = formatAdminURL({
      adminRoute: config.routes.admin,
      path,
    })

    router.push(url)
  }

  const allButtonLabel = `${t('general:all')} ${getTranslation(collectionConfig?.labels?.plural, i18n)}`
  const allButtonId = allButtonLabel.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={baseClass}>
      <Button
        buttonStyle="tab"
        className={[`${baseClass}__button`, viewType === 'list' && `${baseClass}__button--active`]
          .filter(Boolean)
          .join(' ')}
        disabled={viewType === 'list'}
        el="button"
        id={allButtonId}
        onClick={() => handleViewChange('list')}
      >
        {t('general:all')} {getTranslation(collectionConfig?.labels?.plural, i18n)}
      </Button>

      {isFoldersEnabled && (
        <Button
          buttonStyle="tab"
          className={[
            `${baseClass}__button`,
            viewType === 'folders' && `${baseClass}__button--active`,
          ]
            .filter(Boolean)
            .join(' ')}
          disabled={viewType === 'folders'}
          el="button"
          onClick={() => handleViewChange('folders')}
        >
          {t('folder:byFolder')}
        </Button>
      )}

      {isTrashEnabled && (
        <Button
          buttonStyle="tab"
          className={[
            `${baseClass}__button`,
            viewType === 'trash' && `${baseClass}__button--active`,
          ]
            .filter(Boolean)
            .join(' ')}
          disabled={viewType === 'trash'}
          el="button"
          id="trash-view-pill"
          onClick={() => handleViewChange('trash')}
        >
          {t('general:trash')}
        </Button>
      )}
    </div>
  )
}
