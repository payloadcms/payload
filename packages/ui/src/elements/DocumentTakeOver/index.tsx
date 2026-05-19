'use client'
import React, { useEffect } from 'react'

import { useRouteCache } from '../../providers/RouteCache/index.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { AlertModal, useModal } from '../Modal/index.js'

const modalSlug = 'document-take-over'

export const DocumentTakeOver: React.FC<{
  handleBackToDashboard: () => void
  isActive: boolean
  onReadOnly: () => void
}> = ({ handleBackToDashboard, isActive, onReadOnly }) => {
  const { closeModal, openModal } = useModal()
  const { t } = useTranslation()
  const { startRouteTransition } = useRouteTransition()
  const { clearRouteCache } = useRouteCache()

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
        <>
          <Button
            buttonStyle="primary"
            id={`${modalSlug}-back-to-dashboard`}
            onClick={() => {
              startRouteTransition(() => handleBackToDashboard())
            }}
          >
            {t('general:backToDashboard')}
          </Button>
          <Button
            buttonStyle="secondary"
            id={`${modalSlug}-view-read-only`}
            onClick={() => {
              onReadOnly()
              closeModal(modalSlug)
              clearRouteCache()
            }}
          >
            {t('general:viewReadOnly')}
          </Button>
        </>
      }
      compact
      slug={modalSlug}
      title={t('general:editingTakenOver')}
    >
      <p>{t('general:anotherUserTakenOver')}</p>
    </AlertModal>
  )
}
