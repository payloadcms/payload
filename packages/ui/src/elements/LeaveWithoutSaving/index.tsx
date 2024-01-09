'use client'
import { Modal, useModal } from '@faceless-ui/modal'
import React, { useEffect } from 'react'
import { useTranslation } from '../../providers/Translation'

import { Button } from '../../elements/Button'
import { useFormModified } from '../../forms/Form/context'
import { useAuth } from '../../providers/Auth'
import './index.scss'

const modalSlug = 'leave-without-saving'

const baseClass = 'leave-without-saving'

const Component: React.FC<{
  isActive: boolean
  onCancel: () => void
  onConfirm: () => void
}> = ({ isActive, onCancel, onConfirm }) => {
  const { closeModal, openModal } = useModal()
  const { t } = useTranslation()

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

  return null
  // <NavigationPrompt renderIfNotActive when={Boolean(modified && user)}>
  //   {({ isActive, onCancel, onConfirm }) => (
  //     <Component isActive={isActive} onCancel={onCancel} onConfirm={onConfirm} />
  //   )}
  // </NavigationPrompt>
}
