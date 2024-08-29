'use client'
import { Button, Modal, useAuth, useFormModified, useModal, useTranslation } from '@payloadcms/ui'
import React, { useCallback, useEffect } from 'react'

import './index.scss'
import { usePreventLeave } from './usePreventLeave.js'

const modalSlug = 'leave-without-saving'

const baseClass = 'leave-without-saving'

const Component: React.FC<{
  isActive: boolean
  onCancel: () => void
  onConfirm: () => void
}> = ({ isActive, onCancel, onConfirm }) => {
  const { closeModal, modalState, openModal } = useModal()
  const { t } = useTranslation()

  // Manually check for modal state as 'esc' key will not trigger the nav inactivity
  // useEffect(() => {
  //   if (!modalState?.[modalSlug]?.isOpen && isActive) {
  //     onCancel()
  //   }
  // }, [modalState, isActive, onCancel])

  useEffect(() => {
    if (isActive) {
      openModal(modalSlug)
    } else {
      closeModal(modalSlug)
    }
  }, [isActive, openModal, closeModal])

  return (
    <Modal className={baseClass} onClose={onCancel} slug={modalSlug}>
      <div className={`${baseClass}__wrapper`}>
        <div className={`${baseClass}__content`}>
          <h1>{t('general:leaveWithoutSaving')}</h1>
          <p>{t('general:changesNotSaved')}</p>
        </div>
        <div className={`${baseClass}__controls`}>
          <Button buttonStyle="secondary" onClick={onCancel} size="large">
            {t('general:stayOnThisPage')}
          </Button>
          <Button onClick={onConfirm} size="large">
            {t('general:leaveAnyway')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export const LeaveWithoutSaving: React.FC = () => {
  const { closeModal } = useModal()
  const modified = useFormModified()
  const { user } = useAuth()
  const [show, setShow] = React.useState(false)
  const [hasAccepted, setHasAccepted] = React.useState(false)

  const prevent = Boolean(modified && user)

  const onPrevent = useCallback(() => {
    setShow(true)
  }, [])

  const handleAccept = useCallback(() => {
    closeModal(modalSlug)
  }, [closeModal])

  usePreventLeave({ hasAccepted, onAccept: handleAccept, onPrevent, prevent })

  return (
    <Component
      isActive={show}
      onCancel={() => {
        setShow(false)
      }}
      onConfirm={() => {
        setHasAccepted(true)
      }}
    />
  )
}
