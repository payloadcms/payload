import { Modal, useModal } from '@faceless-ui/modal'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import NavigationPrompt from 'react-router-navigation-prompt'

import Button from '../../elements/Button'
import { useFormModified } from '../../forms/Form/context'
import { useAuth } from '../../utilities/Auth'
import './index.scss'

const modalSlug = 'leave-without-saving'

const baseClass = 'leave-without-saving'

const Component: React.FC<{
  isActive: boolean
  onCancel: () => void
  onConfirm: () => void
}> = ({ isActive, onCancel, onConfirm }) => {
  const { closeModal, openModal, modalState } = useModal()
  const { t } = useTranslation('general')

  // Manually check for modal state as 'esc' key will not trigger the nav inactivity
  useEffect(() => {
    if (!modalState?.[modalSlug]?.isOpen && isActive) {
      onCancel()
    }
  }, [modalState])

  useEffect(() => {
    if (isActive) openModal(modalSlug)
    else closeModal(modalSlug)
  }, [isActive, openModal, closeModal])

  return (
    <Modal className={baseClass} onClose={onCancel} slug={modalSlug}>
      <div className={`${baseClass}__wrapper`}>
        <div className={`${baseClass}__content`}>
          <h1>{t('leaveWithoutSaving')}</h1>
          <p>{t('changesNotSaved')}</p>
        </div>
        <div className={`${baseClass}__controls`}>
          <Button buttonStyle="secondary" onClick={onCancel}>
            {t('stayOnThisPage')}
          </Button>
          <Button onClick={onConfirm}>{t('leaveAnyway')}</Button>
        </div>
      </div>
    </Modal>
  )
}

export const LeaveWithoutSaving: React.FC = () => {
  const modified = useFormModified()
  const { user } = useAuth()

  return (
    <NavigationPrompt renderIfNotActive when={Boolean(modified && user)}>
      {({ isActive, onCancel, onConfirm }) => (
        <Component isActive={isActive} onCancel={onCancel} onConfirm={onConfirm} />
      )}
    </NavigationPrompt>
  )
}
