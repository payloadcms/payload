'use client'
import type { ClientUploadSession } from 'payload'

import { useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'

import {
  cancelUploadSession,
  listUploadSessions,
  resumeUploadSession,
  UploadSessionClientError,
} from '../../utilities/uploadWithSession.js'
import { useConfig } from '../Config/index.js'
import { useTranslation } from '../Translation/index.js'
import { createProgressToast, pickFile } from './browser.js'
import { findSessionsHeldByOtherTabs } from './otherTabs.js'

/**
 * After a reload or browser restart, offers to resume each unfinished upload. The browser cannot
 * reopen the original file on its own, so the user reselects it; only missing segments are sent.
 * Runs again for each signed-in user, since sessions belong to the user who started them.
 */
export const useRecoverUploadSessions = ({
  finishInBackground,
  getErrorMessage,
  recoveringSessionIDsRef,
  requestArgs,
  trackToast,
  userID,
}: {
  finishInBackground: (args: { session: ClientUploadSession }) => Promise<void>
  getErrorMessage: (err: unknown) => string
  /** Sessions this tab is resuming, reported to other tabs as held. */
  recoveringSessionIDsRef: React.RefObject<Set<string>>
  requestArgs: { apiRoute: string; serverURL: string }
  /** Registers a toast so it is dismissed when the user changes. */
  trackToast: (id: string) => string
  userID?: number | string
}) => {
  const { config, getEntityConfig } = useConfig()
  const { t } = useTranslation()
  /** The user whose sessions were last offered, so each user is checked once. */
  const checkedUserIDRef = useRef<number | string | undefined>(undefined)
  /** Recovery uploads in progress, stopped when the user changes. */
  const recoveryControllersRef = useRef(new Map<string, AbortController>())

  const hasSegmentedCollections = config.collections.some(
    ({ upload }) => upload?.uploadInstructions?.supportsSegmentedUploads,
  )

  // Sessions belong to the user who started them, so a new user must not keep sending them.
  useEffect(() => {
    const recoveryControllers = recoveryControllersRef.current
    const recoveringSessionIDs = recoveringSessionIDsRef.current

    return () => {
      for (const [sessionID, controller] of recoveryControllers) {
        controller.abort()
        recoveringSessionIDs.delete(sessionID)
      }

      recoveryControllers.clear()
    }
  }, [recoveringSessionIDsRef, userID])

  const offerRecovery = useCallback(
    function offer({
      session,
      wasFileMismatch,
    }: {
      session: ClientUploadSession
      wasFileMismatch?: boolean
    }) {
      const sessionID = String(session.id)
      const toastID = trackToast(`upload-session-recovery-${sessionID}`)

      const resume = (file: File) => {
        const controller = new AbortController()
        const progress = createProgressToast({ id: toastID })

        recoveryControllersRef.current.set(sessionID, controller)
        recoveringSessionIDsRef.current.add(sessionID)

        progress.show(t('upload:resumingFile', { filename: file.name }))

        resumeUploadSession({
          file,
          onProgress: ({ loaded, total }) =>
            progress.show(
              t('upload:uploadingFileProgress', {
                filename: file.name,
                percent: Math.floor((loaded / total) * 100),
              }),
            ),
          retries: getEntityConfig({ collectionSlug: session.collectionSlug })?.upload?.transfer
            ?.retries,
          session,
          signal: controller.signal,
          ...requestArgs,
        })
          .then(() => {
            toast.dismiss(toastID)
            return finishInBackground({ session })
          })
          .catch((err: unknown) => {
            if (controller.signal.aborted) {
              return
            }

            // The user picked the wrong file, so they can pick again.
            if (err instanceof UploadSessionClientError && err.code === 'fileMismatch') {
              offer({ session, wasFileMismatch: true })
              return
            }

            toast.error(getErrorMessage(err), { id: toastID })
          })
          .finally(() => {
            if (recoveryControllersRef.current.get(sessionID) === controller) {
              recoveryControllersRef.current.delete(sessionID)
              recoveringSessionIDsRef.current.delete(sessionID)
            }
          })
      }

      toast.warning(
        t(session.hasIntent ? 'upload:uploadInterruptedWillSave' : 'upload:uploadInterrupted', {
          filename: session.file.filename,
        }),
        {
          id: toastID,
          action: {
            label: t('upload:selectFile'),
            onClick: (event) => {
              // Keeps the offer open while the picker is open, so cancelling it loses nothing.
              event.preventDefault()
              pickFile({ accept: session.file.mimeType, onPick: resume })
            },
          },
          cancel: {
            label: t('upload:cancelUpload'),
            onClick: () =>
              void cancelUploadSession({ id: session.id, ...requestArgs }).catch(() => {}),
          },
          description: wasFileMismatch ? t('upload:uploadFileMismatch') : undefined,
          duration: Infinity,
        },
      )
    },
    [
      finishInBackground,
      getEntityConfig,
      getErrorMessage,
      recoveringSessionIDsRef,
      requestArgs,
      t,
      trackToast,
    ],
  )

  useEffect(() => {
    if (!hasSegmentedCollections || userID === undefined || checkedUserIDRef.current === userID) {
      return
    }

    checkedUserIDRef.current = userID

    void listUploadSessions(requestArgs)
      .then(async (sessions) => {
        const heldByOtherTabs = await findSessionsHeldByOtherTabs({
          sessionIDs: sessions.map(({ id }) => String(id)),
        })

        // Another user signed in meanwhile.
        if (checkedUserIDRef.current !== userID) {
          return
        }

        for (const session of sessions) {
          if (heldByOtherTabs.has(String(session.id))) {
            continue
          }

          if (session.isStorageComplete) {
            void finishInBackground({ session })
            continue
          }

          offerRecovery({ session })
        }
      })
      .catch(() => {})
  }, [finishInBackground, hasSegmentedCollections, offerRecovery, requestArgs, userID])
}
