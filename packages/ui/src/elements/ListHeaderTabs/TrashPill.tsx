'use client'

import type { ClientCollectionConfig, ViewTypes } from 'payload'

import { formatAdminURL } from 'payload/shared'

import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'

export function TrashPill({
  collectionConfig,
  viewType,
}: {
  collectionConfig: ClientCollectionConfig
  readonly viewType: ViewTypes
}) {
  const { t } = useTranslation()
  const { config } = useConfig()

  if (!collectionConfig.trash) {
    return null
  }

  return (
    <Button
      buttonStyle="tab"
      disabled={viewType === 'trash'}
      el={viewType === 'list' || viewType === 'folders' ? 'link' : 'div'}
      id="trash-view-pill"
      key="trash-view-pill"
      to={formatAdminURL({
        adminRoute: config.routes.admin,
        path: `/collections/${collectionConfig.slug}/trash`,
        serverURL: config.serverURL,
      })}
    >
      {t('general:trash')}
    </Button>
  )
}
