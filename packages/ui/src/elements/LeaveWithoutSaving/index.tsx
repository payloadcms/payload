'use client'
import React, { useCallback } from 'react'

import type { OnCancel } from '../ConfirmationModal/index.js'

import { useForm, useFormModified } from '../../forms/Form/index.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { ConfirmationModal } from '../ConfirmationModal/index.js'
import { useModal } from '../Modal/index.js'
import { usePreventLeave } from './usePreventLeave.js'

type LeaveWithoutSavingProps = {
  disablePreventLeave?: boolean
  modalSlug?: string
  onConfirm?: () => Promise<void> | void
  onPrevent?: (nextHref: null | string) => void
}

const leaveWithoutSavingModalSlug = 'leave-without-saving'

export const LeaveWithoutSaving: React.FC<LeaveWithoutSavingProps> = ({
  disablePreventLeave = false,
  onConfirm,
  onPrevent,
}) => {
  const modalSlug = leaveWithoutSavingModalSlug
  const { closeModal, openModal } = useModal()
  const modified = useFormModified()
  const { isValid } = useForm()
  const { user } = useAuth()
  const [hasAccepted, setHasAccepted] = React.useState(false)

  const prevent = !disablePreventLeave && Boolean((modified || !isValid) && user)

  const handlePrevent = useCallback(() => {
    const activeHref = (document.activeElement as HTMLAnchorElement)?.href || null
    if (onPrevent) {
      onPrevent(activeHref)
    }
    openModal(modalSlug)
  }, [openModal, onPrevent, modalSlug])

  const handleAccept = useCallback(() => {
    closeModal(modalSlug)
    setHasAccepted(false)
  }, [closeModal, modalSlug])

  usePreventLeave({ hasAccepted, onAccept: handleAccept, onPrevent: handlePrevent, prevent })

  const onCancel: OnCancel = useCallback(() => {
    closeModal(modalSlug)
    setHasAccepted(false)
  }, [closeModal, modalSlug])

  const handleConfirm = useCallback(async () => {
    if (onConfirm) {
      try {
        await onConfirm()
      } catch (err) {
        console.error('Error in LeaveWithoutSaving onConfirm:', err)
      }
    }
    setHasAccepted(true)
  }, [onConfirm])

  return (
    <LeaveWithoutSavingModal modalSlug={modalSlug} onCancel={onCancel} onConfirm={handleConfirm} />
  )
}

export const LeaveWithoutSavingModal = ({
  modalSlug,
  onCancel,
  onConfirm,
}: {
  modalSlug: string
  onCancel?: OnCancel
  onConfirm: () => Promise<void> | void
}) => {
  const { t } = useTranslation()

  return (
    <ConfirmationModal
      body={t('general:changesNotSaved')}
      cancelLabel={t('general:stayOnThisPage')}
      confirmLabel={t('general:leaveAnyway')}
      heading={t('general:leaveWithoutSaving')}
      modalSlug={modalSlug}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}
