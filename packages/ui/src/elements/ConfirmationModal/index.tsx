'use client'
import React from 'react'

import {
  DialogBody,
  DialogCancel,
  DialogConfirm,
  DialogFooter,
  DialogHeader,
  DialogModal,
} from '../Dialog/index.js'
import './index.css'

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
    onCancel,
    onConfirm,
  } = props

  return (
    <DialogModal className={className} slug={modalSlug}>
      <DialogHeader showClose title={heading} />
      <DialogBody>
        <div className="confirmation-modal__body">
          {typeof body === 'string' ? <p>{body}</p> : body}
        </div>
      </DialogBody>
      <DialogFooter>
        <DialogCancel label={cancelLabel} onClick={onCancel} />
        <DialogConfirm label={confirmLabel} loadingLabel={confirmingLabel} onClick={onConfirm} />
      </DialogFooter>
    </DialogModal>
  )
}
