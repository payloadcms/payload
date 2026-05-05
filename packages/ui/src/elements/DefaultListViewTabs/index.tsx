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
  const isHierarchyEnabled = Boolean(collectionConfig.hierarchy)

  if (!isTrashEnabled && !isHierarchyEnabled) {
    return null
  }

  const handleViewChange = async (newViewType: ViewTypes) => {
    if (onChange) {
      onChange(newViewType)
    }

    // Save preference for list vs hierarchy (not trash)
    if (newViewType === 'list' || newViewType === 'hierarchy') {
      await setPreference(`collection-${collectionConfig.slug}`, {
        listViewType: newViewType,
      })
    }

    let path: `/${string}` = `/collections/${collectionConfig.slug}`
    switch (newViewType) {
      case 'hierarchy':
        path = `/collections/${collectionConfig.slug}/hierarchy`
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

  const collectionLabel = getTranslation(collectionConfig?.labels?.plural, i18n)
  const allButtonLabel = `${t('general:all')} ${collectionLabel}`
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
        {`${t('general:all')} ${collectionLabel}`}
      </Button>

      {isHierarchyEnabled && (
        <Button
          buttonStyle="tab"
          className={[
            `${baseClass}__button`,
            viewType === 'hierarchy' && `${baseClass}__button--active`,
          ]
            .filter(Boolean)
            .join(' ')}
          disabled={viewType === 'hierarchy'}
          el="button"
          id="hierarchy-view-pill"
          onClick={() => handleViewChange('hierarchy')}
        >
          {`${t('general:by')} ${getTranslation(collectionConfig?.labels?.singular, i18n)}`}
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
