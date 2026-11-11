'use client'
import type { ClientUploadSession, UploadCollectionSlug, UploadInstructions } from 'payload'

import { formatAdminURL } from 'payload/shared'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import type { UploadSessionIntentData } from '../../utilities/uploadWithSession.js'

import { useBeforeUnload } from '../../elements/LeaveWithoutSaving/usePreventLeave.js'
import {
  cancelUploadSession,
  clearUploadSessionIntent,
  completeUploadSession,
  createUploadSession,
  getUploadSession,
  getUploadSessionFile,
  isUploadSessionGoneError,
  resumeUploadSession,
  setUploadSessionIntent,
  shouldUseUploadSession,
  UploadSessionClientError,
} from '../../utilities/uploadWithSession.js'
import { useAuth } from '../Auth/index.js'
import { useConfig } from '../Config/index.js'
import { useRouter } from '../RouterAdapter/index.js'
import { useTranslation } from '../Translation/index.js'
import { createProgressToast } from './browser.js'
import { useAnswerOtherTabs } from './otherTabs.js'
import { useRecoverUploadSessions } from './useRecoverUploadSessions.js'

/** Thrown to a waiting save when its form unmounts; the coordinator finishes the save instead. */
export class UploadContinuesInBackgroundError extends Error {
  constructor() {
    super('The upload will finish in the background and the document will be saved then.')
    this.name = 'UploadContinuesInBackgroundError'
  }
}

type UploadEntry = {
  collectionSlug: UploadCollectionSlug
  controller: AbortController
  /** Rejects the waiting save when the form unmounts. */
  detach: (error: Error) => void
  detached: Promise<never>
  /** Resolves with the file reference once storage is complete. */
  file: Promise<UploadInstructions['file']>
  /** The file the form holds, which the entry is tracked under. */
  formFile: File
  hasIntent: boolean
  /** Pending request that stores the intent. Never rejects; background completion waits for it. */
  intentRequest?: Promise<void>
  /** Adopted from a link: the bytes are already in storage and not in this browser. */
  isAdopted?: boolean
  isAttached: boolean
  /** Counted in `isSaveWaitingOnUpload` until the upload settles. */
  isCountedAsWaitingSave?: boolean
  /** The upload stopped with an error. The next save resumes the same session. */
  isFailed?: boolean
  isSettled: boolean
  /** Whether a save has consumed or is waiting on this upload. */
  isWaitedOn: boolean
  session: Promise<ClientUploadSession>
  /**
   * The session's ID once known, or the session being resumed until it resolves. Tells other tabs
   * this tab holds it, and lets a later retry resume it instead of creating another one.
   */
  sessionID?: string
  /** The document prefix the session was started with. Storage keeps the object under it. */
  startedDocPrefix?: string
  targetID?: number | string
  toastID: string
}

export type UploadSessionsContext = {
  /**
   * Attaches a form to a session whose storage is already complete, e.g. from a "finish saving"
   * link. Returns a placeholder file for the form's file field, or null if the session cannot be used.
   */
  adopt: (args: { sessionID: string }) => Promise<File | null>
  /** Cancels the upload started for a file the form no longer holds. */
  cancel: (args: { file: File }) => void
  /** The form holding this file unmounted; the coordinator keeps the upload going. */
  detach: (args: { file: File }) => void
  /** Returns a promise for the file reference if a session upload is tracked for this file. */
  getUploadedFile: (args: {
    docPrefix?: string
    file: File
    intent?: UploadSessionIntentData
  }) => null | Promise<UploadInstructions['file']>
  /**
   * Whether a submitted save is waiting on the upload of this file. Leaving that form is safe,
   * because the coordinator finishes the save, so its leave-without-saving prompt is skipped.
   */
  isSaveWaitingOnUpload: (args: { file: File }) => boolean
  /** Whether a session upload for this file is still transferring. */
  isUploading: (args: { file: File }) => boolean
  /** Starts a session upload when the file qualifies. Returns whether one was started. */
  start: (args: {
    collectionSlug: UploadCollectionSlug
    /** The document's storage prefix, which places the stored object. */
    docPrefix?: string
    file: File
    /** A session this file already started, resumed instead of creating another one. */
    resumeSessionID?: string
    targetID?: number | string
  }) => boolean
}

const Context = React.createContext<null | UploadSessionsContext>(null)

/**
 * Coordinates durable uploads for the whole Admin so they survive client-side navigation. Large
 * files start uploading when they are picked; saving waits for the upload instead of starting it.
 */
export const UploadSessionsProvider = ({ children }: { children: React.ReactNode }) => {
  const { config, getEntityConfig } = useConfig()
  const { user } = useAuth()
  const router = useRouter()
  const { t } = useTranslation()
  const userID = user?.id

  const getErrorMessage = useCallback(
    (err: unknown) => {
      if (err instanceof UploadSessionClientError) {
        return err.code === 'fileMismatch'
          ? t('upload:uploadFileMismatch')
          : t('upload:uploadStorageRejectedSegments')
      }

      return err instanceof Error ? err.message : String(err)
    },
    [t],
  )
  const entriesRef = useRef(new Map<File, UploadEntry>())
  /** One adoption per session while its stand-in file is tracked, e.g. when a dev-mode effect runs twice. */
  const adoptionsRef = useRef(new Map<string, Promise<File | null>>())
  /** Sessions this tab is resuming after a reload, reported to other tabs as held. */
  const recoveringSessionIDsRef = useRef(new Set<string>())
  /** Upload toasts that belong to the signed-in user and are dismissed when the user changes. */
  const toastIDsRef = useRef(new Set<string>())

  const trackToast = useCallback((id: string) => {
    toastIDsRef.current.add(id)
    return id
  }, [])

  /**
   * Stops tracking an entry. A replacement may already be tracked under the same file (an upload
   * restarted under a new prefix), so only the entry itself is removed. A removed adoption is forgotten,
   * so the next `adopt` tracks a new stand-in instead of returning this untracked one.
   */
  const removeEntry = useCallback((entry: UploadEntry) => {
    if (entriesRef.current.get(entry.formFile) === entry) {
      entriesRef.current.delete(entry.formFile)
    }

    if (entry.isAdopted && entry.sessionID) {
      adoptionsRef.current.delete(entry.sessionID)
    }
  }, [])
  const [waitingSaveCount, setWaitingSaveCount] = useState(0)

  const releaseWaitingSave = useCallback((entry: UploadEntry) => {
    if (entry.isCountedAsWaitingSave) {
      entry.isCountedAsWaitingSave = false
      setWaitingSaveCount((count) => count - 1)
    }
  }, [])

  const requestArgs = useMemo(
    () => ({ apiRoute: config.routes.api, serverURL: config.serverURL }),
    [config.routes.api, config.serverURL],
  )

  const getDocumentURL = useCallback(
    ({ id, collectionSlug }: { collectionSlug: string; id?: null | number | string }) =>
      formatAdminURL({
        adminRoute: config.routes.admin,
        path: `/collections/${collectionSlug}/${id ?? 'create'}`,
      }),
    [config.routes.admin],
  )

  /** Opens the session's document with the upload attached, so the user can finish saving. */
  const getFinishSavingURL = useCallback(
    ({ session }: { session: ClientUploadSession }) =>
      `${getDocumentURL({ id: session.targetID, collectionSlug: session.collectionSlug })}?uploadSession=${session.id}`,
    [getDocumentURL],
  )

  const showSaved = useCallback(
    ({ id, collectionSlug }: { collectionSlug: string; id: number | string }) => {
      // Persistent so keyboard and screen-reader users can reach the action (WCAG 2.2.1).
      toast.success(t('upload:uploadSavedInBackground'), {
        id: trackToast(`upload-session-saved-${collectionSlug}-${id}`),
        action: {
          label: t('general:open'),
          onClick: () => router.push(getDocumentURL({ id, collectionSlug })),
        },
        closeButton: true,
        duration: Infinity,
      })
    },
    [getDocumentURL, router, t, trackToast],
  )

  const showReadyToFinish = useCallback(
    ({ session }: { session: ClientUploadSession }) => {
      toast.info(t('upload:uploadReadyToFinishSaving', { filename: session.file.filename }), {
        id: trackToast(`upload-session-ready-${session.id}`),
        action: {
          label: t('upload:finishSaving'),
          onClick: () => router.push(getFinishSavingURL({ session })),
        },
        closeButton: true,
        duration: Infinity,
      })
    },
    [getFinishSavingURL, router, t, trackToast],
  )

  /** Called once storage is complete for an upload whose form is gone. */
  const finishInBackground = useCallback(
    async ({ session }: { session: ClientUploadSession }) => {
      if (!session.hasIntent) {
        showReadyToFinish({ session })
        return
      }

      try {
        const { doc } = await completeUploadSession({ id: session.id, ...requestArgs })

        showSaved({ id: doc.id, collectionSlug: session.collectionSlug })
      } catch (err) {
        toast.error(getErrorMessage(err), {
          id: trackToast(`upload-session-ready-${session.id}`),
          action: {
            label: t('upload:finishSaving'),
            onClick: () => router.push(getFinishSavingURL({ session })),
          },
          duration: Infinity,
        })
      }
    },
    [
      getErrorMessage,
      getFinishSavingURL,
      requestArgs,
      router,
      showReadyToFinish,
      showSaved,
      t,
      trackToast,
    ],
  )

  const start = useCallback<UploadSessionsContext['start']>(
    ({ collectionSlug, docPrefix, file, resumeSessionID, targetID }) => {
      const collectionConfig = getEntityConfig({ collectionSlug })

      if (!collectionConfig || !shouldUseUploadSession({ collectionConfig, file })) {
        return false
      }

      const controller = new AbortController()
      const toastID = trackToast(`upload-session-${crypto.randomUUID()}`)
      let detach: UploadEntry['detach'] = () => {}
      const detached = new Promise<never>((_, reject) => {
        detach = reject
      })

      // Avoid unhandled rejections when nothing is waiting on the upload.
      detached.catch(() => {})

      // Not aborted with the upload: the server may already have created the session, and
      // `cancel` needs its ID to release it.
      const createSession = () =>
        createUploadSession({
          collectionSlug,
          docPrefix,
          file,
          targetID,
          ...requestArgs,
        })

      // A retry after a failed upload continues its session, so only missing parts are sent and
      // the session does not linger next to a new one. Only a session that is gone is replaced;
      // other errors, e.g. while offline, fail this attempt and the next retry resumes again.
      const session = resumeSessionID
        ? getUploadSession({ id: resumeSessionID, ...requestArgs }).then(
            (existing) =>
              existing.status === 'pending' || existing.status === 'active'
                ? existing
                : createSession(),
            (err: unknown) => {
              if (isUploadSessionGoneError(err)) {
                return createSession()
              }

              throw err
            },
          )
        : createSession()

      const progress = createProgressToast({ id: toastID })

      const uploadedFile = session.then((createdSession) =>
        resumeUploadSession({
          file,
          onProgress: ({ loaded, total }) =>
            progress.show(
              t('upload:uploadingFileProgress', {
                filename: file.name,
                percent: Math.floor((loaded / total) * 100),
              }),
            ),
          retries: collectionConfig.upload.transfer?.retries,
          session: createdSession,
          signal: controller.signal,
          ...requestArgs,
        }),
      )

      const entry: UploadEntry = {
        collectionSlug,
        controller,
        detach,
        detached,
        file: uploadedFile,
        formFile: file,
        hasIntent: false,
        isAttached: true,
        isSettled: false,
        isWaitedOn: false,
        session,
        sessionID: resumeSessionID,
        startedDocPrefix: docPrefix,
        targetID,
        toastID,
      }

      entriesRef.current.set(file, entry)
      void session.then(
        ({ id }) => {
          entry.sessionID = String(id)
        },
        () => {},
      )
      progress.show(t('upload:uploadingFile', { filename: file.name }))

      uploadedFile.then(
        async () => {
          entry.isSettled = true
          releaseWaitingSave(entry)
          toast.dismiss(toastID)

          if (!entry.isAttached) {
            removeEntry(entry)
            // `hasIntent` is final only once the intent request has settled.
            await entry.intentRequest
            await finishInBackground({
              session: { ...(await session), hasIntent: entry.hasIntent },
            })
            return
          }

          // The form is still open and saves the document itself, so the stored data must not
          // be saved again later, e.g. by a recovery after that save failed.
          if (entry.hasIntent) {
            entry.hasIntent = false
            void Promise.resolve(entry.intentRequest)
              .then(() => session)
              .then(({ id }) => clearUploadSessionIntent({ id, ...requestArgs }))
              .catch(() => {})
          }
        },
        (err: unknown) => {
          entry.isSettled = true
          releaseWaitingSave(entry)

          if (controller.signal.aborted) {
            removeEntry(entry)
            toast.dismiss(toastID)
            return
          }

          // Kept, so the next save resumes this session instead of starting another one.
          entry.isFailed = true

          toast.error(
            `${t('upload:uploadInterrupted', { filename: file.name })} ${getErrorMessage(err)}`,
            { id: toastID, duration: Infinity },
          )
        },
      )

      return true
    },
    [
      finishInBackground,
      getEntityConfig,
      getErrorMessage,
      releaseWaitingSave,
      removeEntry,
      requestArgs,
      t,
      trackToast,
    ],
  )

  const cancel = useCallback<UploadSessionsContext['cancel']>(
    ({ file }) => {
      const entry = entriesRef.current.get(file)

      if (!entry) {
        return
      }

      removeEntry(entry)
      entry.controller.abort()
      releaseWaitingSave(entry)
      toast.dismiss(entry.toastID)

      // A resume that never reached the server still knows the ID of the session it resumes.
      void entry.session
        .then(
          ({ id }) => id,
          () => entry.sessionID,
        )
        .then((id) => (id === undefined ? undefined : cancelUploadSession({ id, ...requestArgs })))
        .catch(() => {})
    },
    [releaseWaitingSave, removeEntry, requestArgs],
  )

  const detach = useCallback<UploadSessionsContext['detach']>(
    ({ file }) => {
      const entry = entriesRef.current.get(file)

      if (!entry) {
        return
      }

      entry.isAttached = false

      if (!entry.isSettled) {
        // The waiting save stops; the coordinator finishes it once storage completes.
        if (entry.isWaitedOn) {
          entry.detach(new UploadContinuesInBackgroundError())
        }
        return
      }

      removeEntry(entry)

      // A failed upload stays recoverable: the next Admin load offers to resume it.
      if (entry.isFailed) {
        return
      }

      // Uploaded but never saved: offer a way back to the form without re-uploading.
      if (!entry.isWaitedOn) {
        void entry.session.then((session) => showReadyToFinish({ session }))
        return
      }

      // A save used this upload. If it failed, offer the same; one that succeeded has completed
      // the session.
      void entry.session
        .then(({ id }) => getUploadSession({ id, ...requestArgs }))
        .then((session) => {
          if (session.status !== 'completed' && session.isStorageComplete) {
            showReadyToFinish({ session })
          }
        })
        .catch(() => {})
    },
    [removeEntry, requestArgs, showReadyToFinish],
  )

  /**
   * Stores the submitted data on the session. A failure rejects the returned promise, so a save
   * still waiting in its form shows the error. A save that already moved to the background gets
   * an error toast, and once storage completes the user is offered to finish saving instead.
   */
  const storeIntent = useCallback(
    ({ entry, intent }: { entry: UploadEntry; intent: UploadSessionIntentData }) => {
      if (!entry.isCountedAsWaitingSave) {
        entry.isCountedAsWaitingSave = true
        setWaitingSaveCount((count) => count + 1)
      }

      entry.hasIntent = true

      const request = entry.session.then(({ id }) =>
        setUploadSessionIntent({ id, intent, ...requestArgs }),
      )

      const intentRequest = request.then(
        () => {},
        (err: unknown) => {
          // A later save stored newer data; this failure no longer describes the session.
          if (entry.intentRequest !== intentRequest) {
            return
          }

          entry.hasIntent = false
          // Leaving the form would now lose the data, so the leave prompt applies again.
          releaseWaitingSave(entry)

          if (!entry.isAttached) {
            toast.error(getErrorMessage(err), {
              id: trackToast(`upload-session-intent-${entry.toastID}`),
              duration: Infinity,
            })
          }
        },
      )

      entry.intentRequest = intentRequest

      const failure = request.then(() => new Promise<never>(() => {}))

      failure.catch(() => {})

      return failure
    },
    [getErrorMessage, releaseWaitingSave, requestArgs, trackToast],
  )

  const getUploadedFile = useCallback<UploadSessionsContext['getUploadedFile']>(
    ({ docPrefix, file, intent }) => {
      let entry = entriesRef.current.get(file)

      if (!entry) {
        return null
      }

      // Storage holds the object under the prefix picked at start, so a file whose prefix changed
      // since then is uploaded again. Adopted uploads have no bytes here to send again.
      if (docPrefix !== entry.startedDocPrefix && !entry.isAdopted) {
        const { collectionSlug, targetID } = entry

        cancel({ file })

        if (!start({ collectionSlug, docPrefix, file, targetID })) {
          return null
        }

        entry = entriesRef.current.get(file)!
      } else if (entry.isFailed) {
        const { collectionSlug, sessionID, startedDocPrefix, targetID } = entry

        removeEntry(entry)
        toast.dismiss(entry.toastID)

        if (
          !start({
            collectionSlug,
            docPrefix: startedDocPrefix,
            file,
            resumeSessionID: sessionID,
            targetID,
          })
        ) {
          return null
        }

        entry = entriesRef.current.get(file)!
      }

      entry.isWaitedOn = true

      // A finished upload's reference may be older than its receipt allows, so mint a new one.
      if (entry.isSettled) {
        return entry.session.then(({ id }) => getUploadSessionFile({ id, ...requestArgs }))
      }

      const waits: Promise<UploadInstructions['file']>[] = [entry.file, entry.detached]

      if (intent) {
        waits.push(storeIntent({ entry, intent }))
      }

      return Promise.race(waits)
    },
    [cancel, removeEntry, requestArgs, start, storeIntent],
  )

  const adoptSession = useCallback(
    async ({ sessionID }: { sessionID: string }): Promise<File | null> => {
      const session = await getUploadSession({ id: sessionID, ...requestArgs }).catch(() => null)

      if (!session?.isStorageComplete || session.status === 'completed') {
        return null
      }

      // The bytes are already in storage, so the form only needs a stand-in with the right name.
      const placeholder = new File([], session.file.filename, { type: session.file.mimeType })

      entriesRef.current.set(placeholder, {
        collectionSlug: session.collectionSlug as UploadCollectionSlug,
        controller: new AbortController(),
        detach: () => {},
        detached: new Promise<never>(() => {}),
        // Settled entries always mint a fresh reference when a save asks for one.
        file: new Promise<never>(() => {}),
        formFile: placeholder,
        hasIntent: session.hasIntent,
        isAdopted: true,
        isAttached: true,
        isSettled: true,
        isWaitedOn: false,
        session: Promise.resolve(session),
        sessionID: String(session.id),
        targetID: session.targetID ?? undefined,
        toastID: `upload-session-${session.id}`,
      })

      return placeholder
    },
    [requestArgs],
  )

  const adopt = useCallback<UploadSessionsContext['adopt']>(
    ({ sessionID }) => {
      const existing = adoptionsRef.current.get(sessionID)

      if (existing !== undefined) {
        return existing
      }

      const adoption = adoptSession({ sessionID })

      adoptionsRef.current.set(sessionID, adoption)
      void adoption.then((placeholder) => {
        if (!placeholder) {
          adoptionsRef.current.delete(sessionID)
        }
      })

      return adoption
    },
    [adoptSession],
  )

  const isUploading = useCallback<UploadSessionsContext['isUploading']>(({ file }) => {
    const entry = entriesRef.current.get(file)

    return Boolean(entry && !entry.isSettled)
  }, [])

  // Sessions belong to the user who started them. On sign-out or a switch of user, stop this
  // tab's uploads and hide their toasts. The sessions are kept, so their owner is offered to
  // resume them after signing in again.
  const previousUserIDRef = useRef(userID)

  useEffect(() => {
    if (previousUserIDRef.current === userID) {
      return
    }

    previousUserIDRef.current = userID

    for (const entry of entriesRef.current.values()) {
      entry.controller.abort()
    }

    entriesRef.current.clear()
    adoptionsRef.current.clear()

    for (const id of toastIDsRef.current) {
      toast.dismiss(id)
    }

    toastIDsRef.current.clear()
  }, [userID])

  useBeforeUnload(
    () => [...entriesRef.current.values()].some(({ isSettled }) => !isSettled),
    t('upload:uploadInProgressLeaveWarning'),
  )

  const getHeldSessionIDs = useCallback(() => {
    const heldSessionIDs = new Set(recoveringSessionIDsRef.current)

    for (const { sessionID } of entriesRef.current.values()) {
      if (sessionID) {
        heldSessionIDs.add(sessionID)
      }
    }

    return heldSessionIDs
  }, [])

  useAnswerOtherTabs({ getHeldSessionIDs })

  useRecoverUploadSessions({
    finishInBackground,
    getErrorMessage,
    recoveringSessionIDsRef,
    requestArgs,
    trackToast,
    userID,
  })

  // Changes identity whenever the count changes, so forms re-check their own file.
  const isSaveWaitingOnUpload = useCallback<UploadSessionsContext['isSaveWaitingOnUpload']>(
    ({ file }) =>
      waitingSaveCount > 0 && Boolean(entriesRef.current.get(file)?.isCountedAsWaitingSave),
    [waitingSaveCount],
  )

  const value = useMemo(
    () => ({
      adopt,
      cancel,
      detach,
      getUploadedFile,
      isSaveWaitingOnUpload,
      isUploading,
      start,
    }),
    [adopt, cancel, detach, getUploadedFile, isSaveWaitingOnUpload, isUploading, start],
  )

  return <Context value={value}>{children}</Context>
}

/** For components that may render outside the Admin root, such as custom views. */
export const useOptionalUploadSessions = (): null | UploadSessionsContext => React.use(Context)

export const useUploadSessions = (): UploadSessionsContext => {
  const context = React.use(Context)

  if (context === null) {
    throw new Error('useUploadSessions must be used within UploadSessionsProvider')
  }

  return context
}
