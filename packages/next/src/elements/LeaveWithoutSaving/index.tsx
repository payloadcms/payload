'use client'
import { Modal, useModal } from '@payloadcms/ui'
import React, { useCallback, useEffect } from 'react'

import { Button } from '../../../../ui/src/elements/Button'
import { useFormModified } from '../../../../ui/src/forms/Form/context'
import { useAuth } from '../../../../ui/src/providers/Auth'
import { useTranslation } from '../../../../ui/src/providers/Translation'
import './index.scss'
import { usePreventLeave } from './usePreventLeave'

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
    if (isActive) openModal(modalSlug)
    else closeModal(modalSlug)
  }, [isActive, openModal, closeModal])

  return (
    <Modal className={baseClass} onClose={onCancel} slug={modalSlug}>
      <div className={`${baseClass}__wrapper`}>
        <div className={`${baseClass}__content`}>
          <h1>{t('general:leaveWithoutSaving')}</h1>
          <p>{t('general:changesNotSaved')}</p>
        </div>
        <div className={`${baseClass}__controls`}>
          <Button buttonStyle="secondary" onClick={onCancel}>
            {t('general:stayOnThisPage')}
          </Button>
          <Button onClick={onConfirm}>{t('general:leaveAnyway')}</Button>
        </div>
      </div>
    </Modal>
  )
}

export const LeaveWithoutSaving: React.FC = () => {
  const modified = useFormModified()
  const { user } = useAuth()
  const [show, setShow] = React.useState(false)
  const [hasAccepted, setHasAccepted] = React.useState(false)

  const preventLeave = Boolean(modified && user)

  const onPrevent = useCallback(() => {
    setShow(true)
  }, [])

  usePreventLeave({ hasAccepted, onPrevent, preventLeave })

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
