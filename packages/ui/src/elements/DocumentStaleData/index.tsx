'use client'
import React, { useEffect } from 'react'

import { useRouteCache } from '../../providers/RouteCache/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { Modal, useModal } from '../Modal/index.js'
import './index.scss'

const modalSlug = 'document-stale-data'

const baseClass = 'document-stale-data'

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
    <Modal className={baseClass} closeOnBlur={false} slug={modalSlug}>
      <div className={`${baseClass}__wrapper`}>
        <div className={`${baseClass}__content`}>
          <h1>{t('general:documentModified')}</h1>
          <p>{t('general:documentOutOfDate')}</p>
        </div>
        <div className={`${baseClass}__controls`}>
          <Button
            buttonStyle="primary"
            id={`${modalSlug}-reload`}
            margin={false}
            onClick={async () => {
              closeModal(modalSlug)
              clearRouteCache()
              await onReload()
            }}
            size="medium"
          >
            {t('general:reloadDocument')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
