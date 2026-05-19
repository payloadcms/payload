'use client'
import React, { useEffect } from 'react'

import { useRouteCache } from '../../providers/RouteCache/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { AlertModal, useModal } from '../Modal/index.js'

const modalSlug = 'document-stale-data'

export const DocumentStaleData: React.FC<{
  isActive: boolean
  onReload: () => Promise<void> | void
}> = ({ isActive, onReload }) => {
  const { closeModal, openModal } = useModal()
  const { clearRouteCache } = useRouteCache()
  const { t } = useTranslation()

  useEffect(() => {
    if (isActive) {
      openModal(modalSlug)
    } else {
      closeModal(modalSlug)
    }
  }, [isActive, openModal, closeModal])

  return (
    <AlertModal
      actions={
        <Button
          buttonStyle="primary"
          id={`${modalSlug}-reload`}
          onClick={async () => {
            closeModal(modalSlug)
            clearRouteCache()
            await onReload()
          }}
        >
          {t('general:reloadDocument')}
        </Button>
      }
      compact
      slug={modalSlug}
      title={t('general:documentModified')}
    >
      <p>{t('general:documentOutOfDate')}</p>
    </AlertModal>
  )
}
