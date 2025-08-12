'use client'

import type { ClientCollectionConfig, ViewTypes } from 'payload'

import { formatAdminURL } from 'payload/shared'

import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import './index.scss'

const baseClass = 'list-pills'

type ByFolderPillProps = {
  readonly collectionConfig: ClientCollectionConfig
  readonly folderCollectionSlug: string
  readonly viewType: ViewTypes
}

export function ByFolderPill({
  collectionConfig,
  folderCollectionSlug,
  viewType,
}: ByFolderPillProps) {
  const { t } = useTranslation()
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
        el={viewType === 'list' || viewType === 'trash' ? 'link' : 'div'}
        to={formatAdminURL({
          adminRoute: config.routes.admin,
          path: `/collections/${collectionConfig.slug}/${folderCollectionSlug}`,
          serverURL: config.serverURL,
        })}
      >
        {t('folder:byFolder')}
      </Button>
    </div>
  )
}
