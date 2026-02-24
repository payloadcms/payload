'use client'
import React, { useEffect } from 'react'

import { useRouteCache } from '../../providers/RouteCache/index.js'
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
          <h1>Document Modified</h1>
          <p>This document was recently updated by another user. Your view is out of date.</p>
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
            Reload document
          </Button>
        </div>
      </div>
    </Modal>
  )
}
