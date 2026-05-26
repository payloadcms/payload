'use client'
import React, { useCallback } from 'react'

import { XIcon } from '../../icons/X/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { drawerZBase, useDrawerDepth } from '../Drawer/index.js'
import { AlertModal, useModal } from '../Modal/index.js'

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

  const { closeModal, isModalOpen } = useModal()
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

  if (!isModalOpen(modalSlug)) {
    return null
  }

  return (
    <AlertModal
      actions={
        <>
          <Button
            buttonStyle="secondary"
            disabled={confirming}
            id="confirm-cancel"
            onClick={onCancel}
            size="medium"
            type="button"
          >
            {cancelLabel || t('general:cancel')}
          </Button>
          <Button id="confirm-action" onClick={onConfirm} size="medium">
            {confirming
              ? confirmingLabel || `${t('general:loading')}...`
              : confirmLabel || t('general:confirm')}
          </Button>
        </>
      }
      className={className}
      compact
      headerActions={
        <Button
          aria-label={t('general:close')}
          buttonStyle="ghost"
          disabled={confirming}
          icon={<XIcon size={24} />}
          onClick={onCancel}
        />
      }
      slug={modalSlug}
      title={heading}
      zIndex={drawerZBase + editDepth + 1}
    >
      {typeof body === 'string' ? <p>{body}</p> : body}
    </AlertModal>
  )
}
