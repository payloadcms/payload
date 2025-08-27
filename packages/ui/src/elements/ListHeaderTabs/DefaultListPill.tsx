'use client'

import type { ClientCollectionConfig, ViewTypes } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL } from 'payload/shared'

import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import './index.scss'

const baseClass = 'list-pills'

type DefaultListPillProps = {
  readonly collectionConfig: ClientCollectionConfig
  readonly viewType: ViewTypes
}

export function DefaultListPill({ collectionConfig, viewType }: DefaultListPillProps) {
  const { i18n, t } = useTranslation()
  const { config } = useConfig()

  const buttonLabel = `${t('general:all')} ${getTranslation(collectionConfig?.labels?.plural, i18n)}`
  const buttonId = buttonLabel.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={baseClass}>
      <Button
        buttonStyle="tab"
        className={[`${baseClass}__button`, viewType === 'list' && `${baseClass}__button--active`]
          .filter(Boolean)
          .join(' ')}
        disabled={viewType === 'list'}
        el={viewType === 'folders' || viewType === 'trash' ? 'link' : 'div'}
        id={buttonId}
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
