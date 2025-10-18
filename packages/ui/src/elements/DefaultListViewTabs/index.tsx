'use client'

import type { ClientCollectionConfig, ClientConfig, ListViewTypes, ViewTypes } from 'payload'

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
  onChange?: (viewType: ListViewTypes) => void
  viewType?: ListViewTypes
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
  const isTreeViewEnabled = collectionConfig.treeView && config.treeView

  if (!isTrashEnabled && !isFoldersEnabled && !isTreeViewEnabled) {
    return null
  }

  const handleViewChange = async (
    newViewType: Extract<
      ViewTypes,
      'collection-folders' | 'collection-tree-view' | 'list' | 'trash'
    >,
  ) => {
    if (onChange) {
      onChange(newViewType)
    }

    if (
      newViewType === 'list' ||
      newViewType === 'collection-folders' ||
      newViewType === 'collection-tree-view'
    ) {
      await setPreference(
        `collection-${collectionConfig.slug}`,
        {
          listViewType: newViewType,
        },
        true,
      )
    }

    let path: `/${string}` = `/collections/${collectionConfig.slug}`
    switch (newViewType) {
      case 'collection-folders':
        if (config.folders) {
          path = `/collections/${collectionConfig.slug}/${config.folders.slug}`
        }
        break
      case 'collection-tree-view':
        path = `/collections/${collectionConfig.slug}/tree-view`
        break
      case 'trash':
        path = `/collections/${collectionConfig.slug}/trash`
        break
    }

    const url = formatAdminURL({
      adminRoute: config.routes.admin,
      path,
      serverURL: config.serverURL,
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
            viewType === 'collection-folders' && `${baseClass}__button--active`,
          ]
            .filter(Boolean)
            .join(' ')}
          disabled={viewType === 'collection-folders'}
          el="button"
          onClick={() => handleViewChange('collection-folders')}
        >
          {t('folder:byFolder')}
        </Button>
      )}

      {isTreeViewEnabled && (
        <Button
          buttonStyle="tab"
          className={[
            `${baseClass}__button`,
            viewType === 'collection-tree-view' && `${baseClass}__button--active`,
          ]
            .filter(Boolean)
            .join(' ')}
          disabled={viewType === 'collection-tree-view'}
          el="button"
          onClick={() => handleViewChange('collection-tree-view')}
        >
          {t('treeView:byTree')}
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
