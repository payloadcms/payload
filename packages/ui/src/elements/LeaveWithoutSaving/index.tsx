'use client'
import React, { useCallback } from 'react'

import type { OnCancel } from '../ConfirmationModal/index.js'

import { useForm, useFormModified } from '../../forms/Form/index.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { ConfirmationModal } from '../ConfirmationModal/index.js'
import { useModal } from '../Modal/index.js'
import { usePreventLeave } from './usePreventLeave.js'

const modalSlug = 'leave-without-saving'

export const LeaveWithoutSaving: React.FC = () => {
  const { getEntityConfig } = useConfig()
  const { closeModal, openModal } = useModal()
  const modified = useFormModified()
  const { isValid } = useForm()
  const { user } = useAuth()
  const [hasAccepted, setHasAccepted] = React.useState(false)
  const { t } = useTranslation()
  const {
    id,
    collectionSlug,
    documentIsLocked,
    documentLockState,
    globalSlug,
    setCurrentEditor,
    setDocumentIsLocked,
    unlockDocument,
  } = useDocumentInfo()

  const collectionConfig = getEntityConfig({ collectionSlug })
  const globalConfig = getEntityConfig({ globalSlug })

  const docConfig = collectionConfig || globalConfig
  const lockDocumentsProp = docConfig?.lockDocuments !== undefined ? docConfig?.lockDocuments : true
  const isLockingEnabled = lockDocumentsProp !== false

  const prevent = Boolean((modified || !isValid) && user)

  const nextHrefRef = React.useRef<null | string>(null)

  const onPrevent = useCallback(() => {
    const activeHref = (document.activeElement as HTMLAnchorElement)?.href
    nextHrefRef.current = activeHref ?? null
    openModal(modalSlug)
  }, [openModal])

  const handleAccept = useCallback(() => {
    closeModal(modalSlug)
  }, [closeModal])

  usePreventLeave({ hasAccepted, onAccept: handleAccept, onPrevent, prevent })

  const onCancel: OnCancel = useCallback(() => {
    closeModal(modalSlug)
  }, [closeModal])

  const onConfirm = useCallback(async () => {
    const lockUser = documentLockState.current?.user

    const isLockOwnedByCurrentUser =
      typeof lockUser === 'object' ? lockUser?.id === user?.id : lockUser === user?.id

    if (isLockingEnabled && documentIsLocked && (id || globalSlug)) {
      // Check where user is trying to go
      const nextHref = nextHrefRef.current
      const nextPath = nextHref ? new URL(nextHref).pathname : ''

      const isInternalView = ['/preview', '/api', '/versions'].some((path) =>
        nextPath.includes(path),
      )
      // Only retain the lock if the user is still viewing the document
      if (!isInternalView) {
        if (isLockOwnedByCurrentUser) {
          try {
            await unlockDocument(id, collectionSlug ?? globalSlug)
            setDocumentIsLocked(false)
            setCurrentEditor(null)
          } catch (err) {
            console.error('Failed to unlock before leave', err)
          }
        }
      }
    }

    setHasAccepted(true)
  }, [
    collectionSlug,
    documentIsLocked,
    documentLockState,
    globalSlug,
    id,
    isLockingEnabled,
    setCurrentEditor,
    setDocumentIsLocked,
    unlockDocument,
    user?.id,
  ])

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
