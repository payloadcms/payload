'use client'
import { Modal, useModal } from '@faceless-ui/modal'
import React, { useEffect } from 'react'

import { useEditDepth } from '../../providers/EditDepth/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { drawerZBase } from '../Drawer/index.js'
import './index.scss'

const baseClass = 'confirmation-modal'

export type OnConfirm = (args: {
  closeConfirmationModal: () => void
  setPerformingConfirmationAction: (state: boolean) => void
}) => Promise<void> | void

export type OnCancel = () => void

export type ConfirmationModalProps = {
  body: React.ReactNode
  cancelLabel?: string
  confirmingLabel?: string
  confirmLabel?: string
  heading: React.ReactNode
  modalSlug: string
  onCancel?: OnCancel
  onConfirm: OnConfirm
}

export function ConfirmationModal(props: ConfirmationModalProps) {
  const {
    body,
    cancelLabel,
    confirmingLabel,
    confirmLabel,
    heading,
    modalSlug,
    onCancel,
    onConfirm,
  } = props

  const editDepth = useEditDepth()

  const [performingAction, setPerformingAction] = React.useState(false)

  const { closeModal } = useModal()
  const { t } = useTranslation()

  useEffect(() => {
    return () => {
      closeModal(modalSlug)
    }
  }, [closeModal, modalSlug])

  return (
    <Modal
      className={baseClass}
      slug={modalSlug}
      style={{
        zIndex: drawerZBase + editDepth,
      }}
    >
      <div className={`${baseClass}__wrapper`}>
        <div className={`${baseClass}__content`}>
          <h1>{heading}</h1>
          <p>{body}</p>
        </div>
        <div className={`${baseClass}__controls`}>
          <Button
            buttonStyle="secondary"
            id="confirm-cancel"
            onClick={
              performingAction
                ? undefined
                : () => {
                    closeModal(modalSlug)
                    if (typeof onCancel === 'function') {
                      onCancel()
                    }
                  }
            }
            size="large"
            type="button"
          >
            {cancelLabel || t('general:cancel')}
          </Button>
          <Button
            id="confirm-action"
            onClick={() => {
              if (!performingAction) {
                setPerformingAction(true)
                void onConfirm({
                  closeConfirmationModal: () => closeModal(modalSlug),
                  setPerformingConfirmationAction: (state) => setPerformingAction(state),
                })
              }
            }}
            size="large"
          >
            {performingAction
              ? confirmingLabel || confirmLabel
              : confirmLabel || t('general:confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
