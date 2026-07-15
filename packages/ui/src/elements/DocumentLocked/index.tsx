'use client'
import type { User } from 'payload'

import { useModal } from '@faceless-ui/modal'
import React, { useEffect } from 'react'

import { useRouteCache } from '../../providers/RouteCache/index.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { isClientUserObject } from '../../utilities/isClientUserObject.js'
import { Button } from '../Button/index.js'
import {
  DialogBody,
  DialogCancel,
  DialogConfirm,
  DialogFooter,
  DialogHeader,
  DialogModal,
} from '../Dialog/index.js'
import './index.css'

const modalSlug = 'document-locked'

const formatDate = (date: null | number | undefined) => {
  if (!date) {
    return ''
  }
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    hour: 'numeric',
    hour12: true,
    minute: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export const DocumentLocked: React.FC<{
  handleGoBack: () => void
  isActive: boolean
  onReadOnly: () => void
  onTakeOver: () => void
  updatedAt?: null | number
  user?: number | string | User
}> = ({ handleGoBack, isActive, onReadOnly, onTakeOver, updatedAt, user }) => {
  const { closeModal, openModal } = useModal()
  const { t } = useTranslation()
  const { clearRouteCache } = useRouteCache()
  const { startRouteTransition } = useRouteTransition()

  useEffect(() => {
    if (isActive) {
      openModal(modalSlug)
    } else {
      closeModal(modalSlug)
    }
  }, [isActive, openModal, closeModal])

  return (
    <DialogModal closeOnEsc={false} size="small" slug={modalSlug}>
      <DialogHeader title={t('general:documentLocked')} />
      <DialogBody>
        <p>
          <strong>
            {isClientUserObject(user) ? (user.email ?? user.id) : `${t('general:user')}: ${user}`}
          </strong>{' '}
          {t('general:currentlyEditing')}
        </p>
        <p className="document-locked__updated-at">
          {t('general:editedSince')} <strong>{formatDate(updatedAt)}</strong>
        </p>
      </DialogBody>
      <DialogFooter>
        <DialogCancel
          label={t('general:goBack')}
          onClick={() => startRouteTransition(() => handleGoBack())}
        />
        <Button
          buttonStyle="secondary"
          id={`${modalSlug}-view-read-only`}
          margin={false}
          onClick={() => {
            onReadOnly()
            closeModal(modalSlug)
            clearRouteCache()
          }}
          size="medium"
        >
          {t('general:viewReadOnly')}
        </Button>
        <DialogConfirm label={t('general:takeOver')} onClick={onTakeOver} />
      </DialogFooter>
    </DialogModal>
  )
}
