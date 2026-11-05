'use client'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import { TrashIcon } from '../../icons/Trash/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Banner } from '../Banner/index.js'
import './index.css'

const baseClass = 'trash-banner'

export const TrashBanner: React.FC = () => {
  const { getEntityConfig } = useConfig()
  const { collectionSlug } = useDocumentInfo()
  const collectionConfig = getEntityConfig({ collectionSlug })

  const { labels } = collectionConfig
  const { i18n } = useTranslation()

  return (
    <Banner className={baseClass} icon={<TrashIcon />} type="warning">
      {i18n.t('general:documentIsTrashed', {
        label: `${getTranslation(labels?.singular, i18n)}`,
      })}
    </Banner>
  )
}
