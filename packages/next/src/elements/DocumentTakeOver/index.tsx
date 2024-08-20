'use client'
import { Button, Modal, useModal, useTranslation } from '@payloadcms/ui'
import LinkImport from 'next/link.js'
import React, { useEffect } from 'react'

import './index.scss'

const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

const modalSlug = 'document-take-over'

const baseClass = 'document-take-over'

export const DocumentTakeOver: React.FC<{
  adminRoute: string
  isActive: boolean
  onReadOnly: () => void
}> = ({ adminRoute, isActive, onReadOnly }) => {
  const { closeModal, openModal } = useModal()
  const { t } = useTranslation()

  useEffect(() => {
    if (isActive) openModal(modalSlug)
    else closeModal(modalSlug)
  }, [isActive, openModal, closeModal])

  return (
    <Modal className={baseClass} slug={modalSlug}>
      <div className={`${baseClass}__wrapper`}>
        <div className={`${baseClass}__content`}>
          <h1>Editing taken over</h1>
        </div>
        <div className={`${baseClass}__controls`}>
          <Button Link={Link} buttonStyle="primary" el="link" size="large" to={adminRoute}>
            {t('general:backToDashboard')}
          </Button>
          <Button
            buttonStyle="secondary"
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
