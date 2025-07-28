'use client'
import React, { useCallback } from 'react'

import type { OnCancel } from '../ConfirmationModal/index.js'

import { useForm, useFormModified } from '../../forms/Form/index.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { ConfirmationModal } from '../ConfirmationModal/index.js'
import { useModal } from '../Modal/index.js'
import { usePreventLeave } from './usePreventLeave.js'

const modalSlug = 'leave-without-saving'

type LeaveWithoutSavingProps = {
  onConfirm?: () => Promise<void> | void
  onPrevent?: (nextHref: null | string) => void
}

export const LeaveWithoutSaving: React.FC<LeaveWithoutSavingProps> = ({ onConfirm, onPrevent }) => {
  const { closeModal, openModal } = useModal()
  const modified = useFormModified()
  const { isValid } = useForm()
  const { user } = useAuth()
  const [hasAccepted, setHasAccepted] = React.useState(false)
  const { t } = useTranslation()

  const prevent = Boolean((modified || !isValid) && user)

  const handlePrevent = useCallback(() => {
    const activeHref = (document.activeElement as HTMLAnchorElement)?.href || null
    if (onPrevent) {
      onPrevent(activeHref)
    }
    openModal(modalSlug)
  }, [openModal, onPrevent])

  const handleAccept = useCallback(() => {
    closeModal(modalSlug)
  }, [closeModal])

  usePreventLeave({ hasAccepted, onAccept: handleAccept, onPrevent: handlePrevent, prevent })

  const onCancel: OnCancel = useCallback(() => {
    closeModal(modalSlug)
  }, [closeModal])

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
    <ConfirmationModal
      body={t('general:changesNotSaved')}
      cancelLabel={t('general:stayOnThisPage')}
      confirmLabel={t('general:leaveAnyway')}
      heading={t('general:leaveWithoutSaving')}
      modalSlug={modalSlug}
      onCancel={onCancel}
      onConfirm={handleConfirm}
    />
  )
}
