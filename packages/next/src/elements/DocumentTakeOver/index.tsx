'use client'
import { Button, Modal, useModal, useTranslation } from '@payloadcms/ui'
import React, { useEffect } from 'react'

import './index.scss'

const modalSlug = 'document-take-over'

const baseClass = 'document-take-over'

export const DocumentTakeOver: React.FC<{
  handleBackToDashboard: () => void
  isActive: boolean
  onReadOnly: () => void
}> = ({ handleBackToDashboard, isActive, onReadOnly }) => {
  const { closeModal, openModal } = useModal()
  const { t } = useTranslation()

  useEffect(() => {
    if (isActive) {
      openModal(modalSlug)
    } else {
      closeModal(modalSlug)
    }
  }, [isActive, openModal, closeModal])

  return (
    <Modal className={baseClass} slug={modalSlug}>
      <div className={`${baseClass}__wrapper`}>
        <div className={`${baseClass}__content`}>
          <h1>{t('general:editingTakenOver')}</h1>
          <p>{t('general:anotherUserTakenOver')}</p>
        </div>
        <div className={`${baseClass}__controls`}>
          <Button
            buttonStyle="primary"
            id={`${modalSlug}-back-to-dashboard`}
            onClick={handleBackToDashboard}
            size="large"
          >
            {t('general:backToDashboard')}
          </Button>
          <Button
            buttonStyle="secondary"
            id={`${modalSlug}-view-read-only`}
            onClick={() => {
              onReadOnly()
              closeModal(modalSlug)
            }}
            size="large"
          >
            {t('general:viewReadOnly')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
