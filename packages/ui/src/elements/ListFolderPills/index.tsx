'use client'

import type { ClientCollectionConfig } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL } from 'payload/shared'

import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import './index.scss'

const baseClass = 'list-folder-pills'

type ListFolderPillsProps = {
  readonly collectionConfig: ClientCollectionConfig
  readonly folderCollectionSlug: string
  readonly viewType: 'folders' | 'list'
}

export function ListFolderPills({
  collectionConfig,
  folderCollectionSlug,
  viewType,
}: ListFolderPillsProps) {
  const { i18n, t } = useTranslation()
  const { config } = useConfig()

  if (!folderCollectionSlug) {
    return null
  }

  return (
    <div className={baseClass}>
      <Button
        buttonStyle="tab"
        className={[
          `${baseClass}__button`,
          viewType === 'folders' && `${baseClass}__button--active`,
        ]
          .filter(Boolean)
          .join(' ')}
        disabled={viewType === 'folders'}
        el={viewType === 'list' ? 'link' : 'div'}
        to={formatAdminURL({
          adminRoute: config.routes.admin,
          path: `/collections/${collectionConfig.slug}/${folderCollectionSlug}`,
          serverURL: config.serverURL,
        })}
      >
        {t('folder:byFolder')}
      </Button>
      <Button
        buttonStyle="tab"
        className={[`${baseClass}__button`, viewType === 'list' && `${baseClass}__button--active`]
          .filter(Boolean)
          .join(' ')}
        disabled={viewType === 'list'}
        el={viewType === 'folders' ? 'link' : 'div'}
        to={formatAdminURL({
          adminRoute: config.routes.admin,
          path: `/collections/${collectionConfig.slug}`,
          serverURL: config.serverURL,
        })}
      >
        {t('general:all')} {getTranslation(collectionConfig?.labels?.plural, i18n)}
      </Button>
    </div>
  )
}
