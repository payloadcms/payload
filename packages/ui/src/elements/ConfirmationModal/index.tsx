'use client'
import { Modal, useModal } from '@faceless-ui/modal'
import React, { useCallback } from 'react'

import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { drawerZBase, useDrawerDepth } from '../Drawer/index.js'
import './index.scss'

const baseClass = 'confirmation-modal'

export type OnCancel = () => void

export type ConfirmationModalProps = {
  body: React.ReactNode
  cancelLabel?: string
  className?: string
  confirmingLabel?: string
  confirmLabel?: string
  heading: React.ReactNode
  modalSlug: string
  onCancel?: OnCancel
  onConfirm: () => Promise<void> | void
}

export function ConfirmationModal(props: ConfirmationModalProps) {
  const {
    body,
    cancelLabel,
    className,
    confirmingLabel,
    confirmLabel,
    heading,
    modalSlug,
    onCancel: onCancelFromProps,
    onConfirm: onConfirmFromProps,
  } = props

  const editDepth = useDrawerDepth()

  const [confirming, setConfirming] = React.useState(false)

  const { closeModal } = useModal()
  const { t } = useTranslation()

  const onConfirm = useCallback(async () => {
    if (!confirming) {
      setConfirming(true)

      if (typeof onConfirmFromProps === 'function') {
        await onConfirmFromProps()
      }

      setConfirming(false)
      closeModal(modalSlug)
    }
  }, [confirming, onConfirmFromProps, closeModal, modalSlug])

  const onCancel = useCallback(() => {
    if (!confirming) {
      closeModal(modalSlug)

      if (typeof onCancelFromProps === 'function') {
        onCancelFromProps()
      }
    }
  }, [confirming, onCancelFromProps, closeModal, modalSlug])

  return (
    <Modal
      className={[baseClass, className].filter(Boolean).join(' ')}
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
            onClick={onCancel}
            size="large"
            type="button"
          >
            {cancelLabel || t('general:cancel')}
          </Button>
          <Button id="confirm-action" onClick={onConfirm} size="large">
            {confirming
              ? confirmingLabel || `${t('general:loading')}...`
              : confirmLabel || t('general:confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
