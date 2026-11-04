'use client'

import type { Data, User } from 'payload'

import { hasAutosaveEnabled } from 'payload/shared'
import { useCallback, useEffect, useRef } from 'react'

import type { BuildFormStateSuccessResult } from '../../utilities/buildFormState.js'
import type { FormStateArgs } from './types.js'

import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useLivePreviewContext, usePreviewURL } from '../../providers/LivePreview/context.js'

/** Minimum time between `updateLastEdited` requests, which keep the document lock alive. */
const LAST_EDITED_INTERVAL_MS = 10_000

type DocumentRequestContext = {
  /** `true` if a submission overlapped the request, so a newer `updatedAt` is the user's own. */
  overlappedSubmit?: boolean
  /** The saved document, for the request after a successful submission. */
  savedDocument?: Data
}

/**
 * Document features that ride on the form-state requests of a document's main Form: locking, stale-data detection, and preview URLs.
 */
export const useDocumentFormState = ({ isDocumentForm }: { isDocumentForm: boolean }) => {
  const {
    data,
    docConfig,
    documentLockState: documentLockStateRef,
    isTrashed,
    setCurrentEditor,
    setDocumentIsLocked,
    setIsStale,
    setLastUpdateTime,
  } = useDocumentInfo()
  const {
    isLivePreviewEnabled,
    setURL: setLivePreviewURL,
    typeofLivePreviewURL,
  } = useLivePreviewContext()
  const { isPreviewEnabled, setPreviewURL } = usePreviewURL()

  const isLockingEnabled = docConfig?.lockDocuments !== false
  const isLivePreviewURLDynamic = isLivePreviewEnabled && typeofLivePreviewURL === 'function'

  const editSessionStartRef = useRef(0)
  const hasCheckedForStaleDataRef = useRef(false)
  const originalUpdatedAtRef = useRef<string | undefined>(data?.updatedAt)

  useEffect(() => {
    editSessionStartRef.current = Date.now()
  }, [])

  const getArgs = useCallback(
    ({
      operation,
      savedDocument,
    }: { operation?: FormStateArgs['operation'] } & DocumentRequestContext): FormStateArgs => {
      if (!isDocumentForm) {
        return {}
      }

      if (savedDocument) {
        originalUpdatedAtRef.current = savedDocument.updatedAt
        hasCheckedForStaleDataRef.current = false

        return { returnLivePreviewURL: isLivePreviewURLDynamic, returnPreviewURL: isPreviewEnabled }
      }

      // Adopt a newer updatedAt, e.g. after router.refresh(), so stale data can be detected again
      if (data?.updatedAt && data.updatedAt > (originalUpdatedAtRef.current ?? '')) {
        originalUpdatedAtRef.current = data.updatedAt
        hasCheckedForStaleDataRef.current = false
      }

      const now = Date.now()
      const updateLastEdited =
        isLockingEnabled && now - editSessionStartRef.current >= LAST_EDITED_INTERVAL_MS

      if (updateLastEdited) {
        editSessionStartRef.current = now
      }

      // Check on the first edit only, and never for autosave, whose own saves would look like stale data
      const checkForStaleData = Boolean(
        !hasCheckedForStaleDataRef.current &&
        originalUpdatedAtRef.current &&
        operation === 'update' &&
        !isTrashed &&
        !hasAutosaveEnabled(docConfig),
      )

      if (checkForStaleData) {
        hasCheckedForStaleDataRef.current = true
      }

      return {
        checkForStaleData,
        originalUpdatedAt: checkForStaleData ? originalUpdatedAtRef.current : undefined,
        returnLockStatus: isLockingEnabled,
        updateLastEdited,
      }
    },
    [
      data?.updatedAt,
      docConfig,
      isDocumentForm,
      isLivePreviewURLDynamic,
      isLockingEnabled,
      isPreviewEnabled,
      isTrashed,
    ],
  )

  const onResponse = useCallback(
    (
      {
        livePreviewURL,
        lockedState,
        previewURL,
        staleDataState,
        state,
      }: BuildFormStateSuccessResult,
      { overlappedSubmit, savedDocument }: DocumentRequestContext,
    ) => {
      if (!isDocumentForm) {
        return
      }

      if (savedDocument) {
        // Don't keep the uploaded File object in form state after it's saved
        if (docConfig && 'upload' in docConfig && docConfig.upload) {
          delete state.file
        }

        if (isLivePreviewURLDynamic) {
          setLivePreviewURL(livePreviewURL)
        }

        if (isPreviewEnabled) {
          setPreviewURL(previewURL)
        }

        return
      }

      if (isLockingEnabled) {
        setDocumentIsLocked?.(true)

        if (lockedState?.user) {
          const previousOwnerID =
            typeof documentLockStateRef.current?.user === 'object'
              ? documentLockStateRef.current?.user?.id
              : documentLockStateRef.current?.user
          const lockedUserID =
            typeof lockedState.user === 'object' ? lockedState.user.id : lockedState.user

          if (!documentLockStateRef.current || lockedUserID !== previousOwnerID) {
            documentLockStateRef.current = {
              hasShownLockedModal: documentLockStateRef.current?.hasShownLockedModal || false,
              isLocked: true,
              user: lockedState.user,
            }
            setCurrentEditor?.(lockedState.user as User)
          }

          if (lockedState.lastEditedAt) {
            setLastUpdateTime(new Date(lockedState.lastEditedAt).getTime())
          }
        }
      }

      if (staleDataState?.isStale && !overlappedSubmit) {
        setIsStale?.(true)
      }
    },
    [
      docConfig,
      documentLockStateRef,
      isDocumentForm,
      isLivePreviewURLDynamic,
      isLockingEnabled,
      isPreviewEnabled,
      setCurrentEditor,
      setDocumentIsLocked,
      setIsStale,
      setLastUpdateTime,
      setLivePreviewURL,
      setPreviewURL,
    ],
  )

  return { getArgs, onResponse }
}
