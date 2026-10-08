import { useState } from 'react'

import type { DocumentReference } from '../../utils/documents.js'
import type { ActivityDocumentsPage } from '../../utils/getActivityWidgetDocs.js'

import { useActivityDocuments } from '../../utils/useActivityDocuments.js'
import { updatePinnedPreferences } from './preferences.js'

/** Pinned documents plus saving pin changes, with optimistic removal. */
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
  initialPage?: ActivityDocumentsPage
  isActive: boolean
  offset: number
  onFocusTab: () => void
  onPinAdded: () => void
  pageSize: number
  pinsURL: string
}) {
  const [saveStatus, setSaveStatus] = useState<'error' | 'idle' | 'saving'>('idle')
  const [previousInitialPage, setPreviousInitialPage] = useState(initialPage)
  const isSaving = saveStatus === 'saving'
  const documents = useActivityDocuments({
    type: 'pinned',
    hasPinPlaceholder: canAddPin,
    initialPage,
    isActive,
    isPaused: isSaving,
    offset,
    pageSize,
  })

  if (previousInitialPage !== initialPage) {
    setPreviousInitialPage(initialPage)
    setSaveStatus((current) => (current === 'error' ? 'idle' : current))
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

    setSaveStatus('saving')
    if (!shouldPin) {
      // The removed card held focus.
      onFocusTab()
    }
    try {
      await updatePinnedPreferences({ document, shouldPin, url: pinsURL })
      setSaveStatus('idle')
      documents.refresh()
      if (shouldPin) {
        onPinAdded()
      }
    } catch {
      restore?.()
      setSaveStatus('error')
    } finally {
      onFocusTab()
    }
  }

  return {
    ...documents,
    hasSaveError: saveStatus === 'error',
    isSaving,
    onAdd: ({ document }: { document: DocumentReference }) =>
      savePin({ document, shouldPin: true }),
    onPickerError: () => setSaveStatus('error'),
    onRemove: ({ document }: { document: DocumentReference }) =>
      savePin({ document, shouldPin: false }),
  }
}

export type PinnedDocumentsController = ReturnType<typeof usePinnedDocuments>
