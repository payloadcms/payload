'use client'
import type { ClientUser } from 'payload'

import React, { useEffect } from 'react'

import { useRouteCache } from '../../providers/RouteCache/index.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { isClientUserObject } from '../../utilities/isClientUserObject.js'
import { Button } from '../Button/index.js'
import { AlertModal, useModal } from '../Modal/index.js'

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
  user?: ClientUser | number | string
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
    <AlertModal
      actions={
        <>
          <Button
            buttonStyle="secondary"
            id={`${modalSlug}-go-back`}
            onClick={() => {
              closeModal(modalSlug)
              startRouteTransition(() => handleGoBack())
            }}
          >
            {t('general:goBack')}
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
          <Button
            buttonStyle="primary"
            id={`${modalSlug}-take-over`}
            onClick={() => {
              onTakeOver()
              closeModal(modalSlug)
            }}
          >
            {t('general:takeOver')}
          </Button>
        </>
      }
      onClose={() => {
        startRouteTransition(() => handleGoBack())
      }}
      slug={modalSlug}
      title={t('general:documentLocked')}
    >
      <p>
        <strong>
          {isClientUserObject(user) ? (user.email ?? user.id) : `${t('general:user')}: ${user}`}
        </strong>{' '}
        {t('general:currentlyEditing')}
      </p>
      <p>
        {t('general:editedSince')} <strong>{formatDate(updatedAt)}</strong>
      </p>
    </AlertModal>
  )
}
