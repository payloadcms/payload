'use client'
import { Modal, useModal } from '@faceless-ui/modal'
import React, { useEffect } from 'react'

import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import './index.scss'

const baseClass = 'confirmation-modal'

export type HandleConfirmationAction = (args: {
  closeConfirmationModal: () => void
  setPerformingConfirmationAction: (state: boolean) => void
}) => Promise<void> | void

export type ConfirmationModalProps = {
  actionLabel: string
  body: React.ReactNode
  handleAction: HandleConfirmationAction
  heading: React.ReactNode
  modalSlug: string
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = (props) => {
  const { actionLabel, body, handleAction, heading, modalSlug } = props
  const [performingAction, setPerformingAction] = React.useState(false)

  const { closeModal } = useModal()
  const { t } = useTranslation()

  useEffect(() => {
    return () => {
      closeModal(modalSlug)
    }
  }, [closeModal, modalSlug])

  return (
    <Modal className={baseClass} slug={modalSlug}>
      <div className={`${baseClass}__wrapper`}>
        <div className={`${baseClass}__content`}>
          <h1>{heading}</h1>
          <p>{body}</p>
        </div>
        <div className={`${baseClass}__controls`}>
          <Button
            buttonStyle="secondary"
            id="confirm-cancel"
            onClick={performingAction ? undefined : () => closeModal(modalSlug)}
            size="large"
            type="button"
          >
            {t('general:cancel')}
          </Button>
          <Button
            id="confirm-action"
            onClick={() => {
              if (!performingAction) {
                setPerformingAction(true)
                void handleAction({
                  closeConfirmationModal: () => closeModal(modalSlug),
                  setPerformingConfirmationAction: (state) => setPerformingAction(state),
                })
              }
            }}
            size="large"
          >
            {performingAction ? actionLabel : t('general:confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
