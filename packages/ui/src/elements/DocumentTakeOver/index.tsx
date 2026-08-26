'use client'
import React, { useEffect } from 'react'

import { useRouteCache } from '../../providers/RouteCache/index.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import {
  DialogBody,
  DialogCancel,
  DialogConfirm,
  DialogFooter,
  DialogHeader,
  DialogModal,
} from '../Dialog/index.js'
import { useModal } from '../Modal/index.js'

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
    <DialogModal closeOnEsc={false} slug={modalSlug}>
      <DialogHeader title={t('general:editingTakenOver')} />
      <DialogBody>
        <p>{t('general:anotherUserTakenOver')}</p>
      </DialogBody>
      <DialogFooter>
        <DialogCancel
          label={t('general:viewReadOnly')}
          onClick={() => {
            onReadOnly()
            clearRouteCache()
          }}
        />
        <DialogConfirm
          label={t('general:backToDashboard')}
          onClick={() => startRouteTransition(() => handleBackToDashboard())}
        />
      </DialogFooter>
    </DialogModal>
  )
}
