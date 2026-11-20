'use client'
import type { ComponentProps } from 'react'

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
  'aria-describedby'?: string
  body: React.ReactNode
  cancelLabel?: string
  className?: string
  confirmingLabel?: string
  confirmLabel?: string
  focusTrapOptions?: ComponentProps<typeof DialogModal>['focusTrapOptions']
  heading: React.ReactNode
  modalSlug: string
  onCancel?: OnCancel
  onConfirm: () => Promise<void> | void
  role?: 'alertdialog' | 'dialog'
}

export function ConfirmationModal(props: ConfirmationModalProps) {
  const {
    'aria-describedby': ariaDescribedBy,
    body,
    cancelLabel,
    className,
    confirmingLabel,
    confirmLabel,
    focusTrapOptions,
    heading,
    modalSlug,
    onCancel,
    onConfirm,
    role,
  } = props

  return (
    <DialogModal
      aria-describedby={ariaDescribedBy}
      className={className}
      focusTrapOptions={focusTrapOptions}
      role={role}
      slug={modalSlug}
    >
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
