'use client'
import React, { useEffect } from 'react'

import { useRouteCache } from '../../providers/RouteCache/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import {
  DialogBody,
  DialogConfirm,
  DialogFooter,
  DialogHeader,
  DialogModal,
} from '../Dialog/index.js'
import { useModal } from '../Modal/index.js'

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
    <DialogModal closeOnEsc={false} size="small" slug={modalSlug}>
      <DialogHeader title={t('general:documentModified')} />
      <DialogBody>
        <p>{t('general:documentOutOfDate')}</p>
      </DialogBody>
      <DialogFooter>
        <DialogConfirm
          label={t('general:reloadDocument')}
          onClick={async () => {
            clearRouteCache()
            await onReload()
          }}
        />
      </DialogFooter>
    </DialogModal>
  )
}
