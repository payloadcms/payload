'use client'
import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import { NewTabIcon } from '../../icons/NewTab/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { ConfirmationModal } from '../ConfirmationModal/index.js'
import './index.css'

type Props = {
  modalSlug: string
  onRetry: () => void
}

export function CloudLimitDocumentCountModal({ modalSlug, onRetry }: Props) {
  const {
    config: {
      routes: { admin: adminRoute },
    },
    getEntityConfig,
  } = useConfig()
  const { collectionSlug } = useDocumentInfo()
  const { i18n, t } = useTranslation()
  const { closeModal } = useModal()

  const collectionConfig = collectionSlug ? getEntityConfig({ collectionSlug }) : null
  const collectionLabel = collectionConfig
    ? getTranslation(collectionConfig.labels?.plural, i18n)
    : 'documents'
  const listURL = collectionSlug
    ? formatAdminURL({ adminRoute, path: `/collections/${collectionSlug}` })
    : undefined

  return (
    <ConfirmationModal
      body={<p>{t('usageLimits:documentLimitReached')}</p>}
      cancelLabel={t('general:gotIt')}
      confirmLabel={t('general:retry')}
      footerLinkAction={
        listURL ? (
          <a
            className="cloud-limit-modal__review-link"
            href={listURL}
            rel="noopener noreferrer"
            target="_blank"
          >
            {t('usageLimits:reviewCollection', { label: collectionLabel })}
            <NewTabIcon size={16} />
          </a>
        ) : null
      }
      heading={t('usageLimits:couldNotSaveDocument')}
      modalSlug={modalSlug}
      onConfirm={() => {
        closeModal(modalSlug)
        onRetry()
      }}
    />
  )
}
