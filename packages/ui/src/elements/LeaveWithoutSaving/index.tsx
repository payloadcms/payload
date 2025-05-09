'use client'
import React, { useCallback, useEffect } from 'react'

import type { OnCancel } from '../ConfirmationModal/index.js'

import { useForm, useFormModified } from '../../forms/Form/index.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { ConfirmationModal } from '../ConfirmationModal/index.js'
import { useModal } from '../Modal/index.js'
import { usePreventLeave } from './usePreventLeave.js'

const modalSlug = 'leave-without-saving'

// Workaround to show the prevent leave page modal
// when clicking the browser navigation button.
// Note that this hook assumes only back button being used
// and not forward button. Which is the case for most of the time.
const useOnBrowserHistoryChange = ({
  hasAcceptedLeave,
  hasCancelledLeave,
  onLeave,
  onPrevent,
  onStay,
  shouldPreventLeave,
  skip,
}: {
  hasAcceptedLeave: boolean
  hasCancelledLeave: boolean
  onLeave: () => void
  onPrevent: () => void
  onStay: () => void
  shouldPreventLeave: boolean
  skip: boolean
}) => {
  // Push a duplicated history entry to the stack
  // so that when the popstate event is triggered
  // it doesn't immediately navigate away.
  // This creates a fake visual and we can show the
  // prevent leave page modal in the meantime
  useEffect(() => {
    window.history.pushState(null, '', window.location.href)
  }, [])

  const handlePopState = useCallback(() => {
    if (!skip) {
      if (shouldPreventLeave) {
        onPrevent()
      } else {
        window.history.go(-2) // -2 because we pushed a duplicate entry
      }
    }
  }, [onPrevent, shouldPreventLeave, skip])

  useEffect(() => {
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [handlePopState])

  useEffect(() => {
    if (!skip) {
      if (hasAcceptedLeave) {
        onLeave()
        window.history.go(-2)
      } else if (hasCancelledLeave) {
        onStay()
        window.history.pushState(null, '', window.location.href) // Push a duplicate entry to the stack
      }
    }
  }, [hasAcceptedLeave, hasCancelledLeave, onLeave, onStay, skip])
}

export const LeaveWithoutSaving: React.FC = () => {
  const { closeModal, openModal } = useModal()
  const modified = useFormModified()
  const { isValid } = useForm()
  const { user } = useAuth()
  const [hasAccepted, setHasAccepted] = React.useState(false)
  const [hasCancelled, setHasCancelled] = React.useState(false)
  const { t } = useTranslation()

  const prevent = Boolean((modified || !isValid) && user)

  const onPrevent = useCallback(() => {
    openModal(modalSlug)
    // Reset the modal confirm and cancel state
    setHasAccepted(false)
    setHasCancelled(false)
  }, [openModal])

  const handleAccept = useCallback(() => {
    closeModal(modalSlug)
    setHasAccepted(true)
  }, [closeModal])

  const onCancel: OnCancel = useCallback(() => {
    closeModal(modalSlug)
    setHasCancelled(true)
  }, [closeModal])

  const onConfirm = useCallback(() => {
    setHasAccepted(true)
  }, [])

  const { preventTriggered } = usePreventLeave({
    hasAccepted,
    onAccept: handleAccept,
    onPrevent,
    prevent,
  })

  useOnBrowserHistoryChange({
    hasAcceptedLeave: hasAccepted,
    hasCancelledLeave: hasCancelled,
    onLeave: handleAccept,
    onPrevent,
    onStay: onCancel,
    shouldPreventLeave: prevent,
    skip: preventTriggered,
  })

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
