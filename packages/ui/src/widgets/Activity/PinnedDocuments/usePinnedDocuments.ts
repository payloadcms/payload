import { useState } from 'react'

import type { DocumentReference, DocumentsPage } from '../types.js'

import { useDocuments } from '../utils/useDocuments.js'
import { updatePinnedPreferences } from './preferences.js'

export type PinnedDocumentsController = ReturnType<typeof usePinnedDocuments>

export function usePinnedDocuments({
  canAddPin,
  initialPage,
  isActive,
  offset,
  onFocusTab,
  onPinAdded,
  pageSize,
  pinsURL,
}: {
  canAddPin: boolean
  initialPage?: DocumentsPage
  isActive: boolean
  offset: number
  onFocusTab: () => void
  onPinAdded: () => void
  pageSize: number
  pinsURL: string
}) {
  const [isSaving, setIsSaving] = useState(false)
  const [hasSaveError, setHasSaveError] = useState(false)
  const [previousInitialPage, setPreviousInitialPage] = useState(initialPage)
  const documents = useDocuments({
    hasPinPlaceholder: canAddPin,
    initialPage,
    isActive,
    isPaused: isSaving,
    offset,
    pageSize,
    tab: 'pinned',
  })

  if (previousInitialPage !== initialPage) {
    setPreviousInitialPage(initialPage)
    setHasSaveError(false)
  }

  const savePin = async ({
    document,
    shouldPin,
  }: {
    document: DocumentReference
    shouldPin: boolean
  }) => {
    if (isSaving || documents.isBusy) {
      return
    }

    const restore = shouldPin ? undefined : documents.removeDocument({ document })

    setIsSaving(true)
    setHasSaveError(false)
    if (!shouldPin) {
      onFocusTab()
    }
    try {
      await updatePinnedPreferences({ document, shouldPin, url: pinsURL })
      documents.refresh()
      if (shouldPin) {
        onPinAdded()
      }
    } catch {
      restore?.()
      setHasSaveError(true)
    } finally {
      setIsSaving(false)
      onFocusTab()
    }
  }

  return {
    ...documents,
    hasSaveError,
    isSaving,
    onAdd: ({ document }: { document: DocumentReference }) =>
      savePin({ document, shouldPin: true }),
    onPickerError: () => setHasSaveError(true),
    onRemove: ({ document }: { document: DocumentReference }) =>
      savePin({ document, shouldPin: false }),
  }
}
