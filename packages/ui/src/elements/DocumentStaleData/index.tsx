'use client'
import React, { useEffect } from 'react'

import { useRouteCache } from '../../providers/RouteCache/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { Modal, useModal } from '../Modal/index.js'
import '../DocumentAlert/index.css'

const modalSlug = 'document-stale-data'

const baseClass = 'document-alert'

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
    <Modal className={`${baseClass} ${baseClass}--compact`} closeOnBlur={false} slug={modalSlug}>
      <div className={`${baseClass}__wrapper`}>
        <h4>{t('general:documentModified')}</h4>
        <div className={`${baseClass}__content`}>
          <p>{t('general:documentOutOfDate')}</p>
        </div>
        <div className={`${baseClass}__controls`}>
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
        </div>
      </div>
    </Modal>
  )
}
