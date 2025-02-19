'use client'
import { Modal, useModal } from '@faceless-ui/modal'
import React from 'react'

import { useEditDepth } from '../../providers/EditDepth/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { drawerZBase } from '../Drawer/index.js'
import './index.scss'

const baseClass = 'confirmation-modal'

export type OnConfirm = (args: {
  closeConfirmationModal: () => void
  setConfirming: (state: boolean) => void
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

  const [confirming, setConfirming] = React.useState(false)

  const { closeModal } = useModal()
  const { t } = useTranslation()

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
            disabled={confirming}
            id="confirm-cancel"
            onClick={
              confirming
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
              if (!confirming) {
                setConfirming(true)
                void onConfirm({
                  closeConfirmationModal: () => closeModal(modalSlug),
                  setConfirming: (state) => setConfirming(state),
                })
              }
            }}
            size="large"
          >
            {confirming
              ? confirmingLabel || t('general:loading')
              : confirmLabel || t('general:confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
