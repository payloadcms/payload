'use client'
import type { ClientUploadSession } from 'payload'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

import {
  cancelUploadSession,
  listUploadSessions,
  resumeUploadSession,
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

  const hasSegmentedCollections = config.collections.some(
    ({ upload }) => upload?.uploadInstructions?.supportsSegmentedUploads,
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

          const toastID = trackToast(`upload-session-recovery-${session.id}`)

          toast.warning(
            t(session.hasIntent ? 'upload:uploadInterruptedWillSave' : 'upload:uploadInterrupted', {
              filename: session.file.filename,
            }),
            {
              id: toastID,
              action: {
                label: t('upload:selectFile'),
                onClick: () =>
                  pickFile({
                    accept: session.file.mimeType,
                    onPick: (file) => {
                      const progress = createProgressToast({ id: toastID })
                      const sessionID = String(session.id)

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
                        retries: getEntityConfig({ collectionSlug: session.collectionSlug })?.upload
                          ?.transfer?.retries,
                        session,
                        ...requestArgs,
                      })
                        .then(() => {
                          toast.dismiss(toastID)
                          return finishInBackground({ session })
                        })
                        .catch((err: unknown) => toast.error(getErrorMessage(err), { id: toastID }))
                        .finally(() => recoveringSessionIDsRef.current.delete(sessionID))
                    },
                  }),
              },
              cancel: {
                label: t('upload:cancelUpload'),
                onClick: () =>
                  void cancelUploadSession({ id: session.id, ...requestArgs }).catch(() => {}),
              },
              duration: Infinity,
            },
          )
        }
      })
      .catch(() => {})
  }, [
    finishInBackground,
    getEntityConfig,
    getErrorMessage,
    hasSegmentedCollections,
    recoveringSessionIDsRef,
    requestArgs,
    t,
    trackToast,
    userID,
  ])
}
