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

export const LeaveWithoutSaving: React.FC = () => {
  const { closeModal, openModal } = useModal()
  const modified = useFormModified()
  const { isValid } = useForm()
  const { user } = useAuth()
  const [hasAccepted, setHasAccepted] = React.useState(false)
  const { t } = useTranslation()

  const prevent = Boolean((modified || !isValid) && user)

  const onPrevent = useCallback(() => {
    openModal(modalSlug)
  }, [openModal])

  const handleAccept = useCallback(() => {
    closeModal(modalSlug)
  }, [closeModal])

  usePreventLeave({ hasAccepted, onAccept: handleAccept, onPrevent, prevent })

  const onCancel: OnCancel = useCallback(() => {
    closeModal(modalSlug)
  }, [closeModal])

  const onConfirm = useCallback(() => {
    setHasAccepted(true)
  }, [])

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
