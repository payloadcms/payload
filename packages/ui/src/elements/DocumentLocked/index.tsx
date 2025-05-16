'use client'
import type { ClientUser } from 'payload'

import React, { useEffect } from 'react'

import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { isClientUserObject } from '../../utilities/isClientUserObject.js'
import { Button } from '../Button/index.js'
import { Modal, useModal } from '../Modal/index.js'
import './index.scss'

const modalSlug = 'document-locked'

const baseClass = 'document-locked'

const formatDate = (date) => {
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
  }).format(date)
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
  const { startRouteTransition } = useRouteTransition()

  useEffect(() => {
    if (isActive) {
      openModal(modalSlug)
    } else {
      closeModal(modalSlug)
    }
  }, [isActive, openModal, closeModal])

  return (
    <Modal
      className={baseClass}
      onClose={() => {
        startRouteTransition(() => handleGoBack())
      }}
      slug={modalSlug}
    >
      <div className={`${baseClass}__wrapper`}>
        <div className={`${baseClass}__content`}>
          <h1>{t('general:documentLocked')}</h1>
          <p>
            <strong>
              {isClientUserObject(user) ? (user.email ?? user.id) : `${t('general:user')}: ${user}`}
            </strong>{' '}
            {t('general:currentlyEditing')}
          </p>
          <p>
            {t('general:editedSince')} <strong>{formatDate(updatedAt)}</strong>
          </p>
        </div>
        <div className={`${baseClass}__controls`}>
          <Button
            buttonStyle="secondary"
            id={`${modalSlug}-go-back`}
            onClick={() => {
              startRouteTransition(() => handleGoBack())
            }}
            size="large"
          >
            {t('general:goBack')}
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
          <Button
            buttonStyle="primary"
            id={`${modalSlug}-take-over`}
            onClick={() => {
              void onTakeOver()
              closeModal(modalSlug)
            }}
            size="large"
          >
            {t('general:takeOver')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
