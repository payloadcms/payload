'use client'
import type { ClientUploadSession, UploadCollectionSlug, UploadInstructions } from 'payload'

import { formatAdminURL } from 'payload/shared'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import type { UploadSessionIntentData } from '../../utilities/uploadWithSession.js'

import { useBeforeUnload } from '../../elements/LeaveWithoutSaving/usePreventLeave.js'
import {
  cancelUploadSession,
  completeUploadSession,
  createUploadSession,
  getUploadSession,
  getUploadSessionFile,
  listUploadSessions,
  resumeUploadSession,
  setUploadSessionIntent,
  shouldUseUploadSession,
  UploadSessionClientError,
} from '../../utilities/uploadWithSession.js'
import { useConfig } from '../Config/index.js'
import { useRouter } from '../RouterAdapter/index.js'
import { useTranslation } from '../Translation/index.js'

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
  /** The file the form currently holds, which changes when it is renamed. */
  formFile: File
  hasIntent: boolean
  /** Pending request that stores the intent; background completion waits for it. */
  intentRequest?: Promise<unknown>
  isAttached: boolean
  /** Counted in `isSaveContinuingInBackground` until the upload settles. */
  isCountedAsWaitingSave?: boolean
  isSettled: boolean
  /** Whether a save has consumed or is waiting on this upload. */
  isWaitedOn: boolean
  session: Promise<ClientUploadSession>
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
    file: File
    intent?: UploadSessionIntentData
  }) => null | Promise<UploadInstructions['file']>
  /**
   * Whether a submitted save is waiting on an upload. Leaving the form is safe then, because the
   * coordinator finishes the save, so the leave-without-saving prompt is skipped.
   */
  isSaveContinuingInBackground: boolean
  /** Whether a session upload for this file is still transferring. */
  isUploading: (args: { file: File }) => boolean
  /** The form renamed the file; keep the same upload. */
  rekey: (args: { from: File; to: File }) => void
  /** Starts a session upload when the file qualifies. Returns whether one was started. */
  start: (args: {
    collectionSlug: UploadCollectionSlug
    file: File
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
  const router = useRouter()
  const { t } = useTranslation()

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
    ({ id, collectionSlug }: { collectionSlug: string; id?: number | string }) =>
      formatAdminURL({
        adminRoute: config.routes.admin,
        path: `/collections/${collectionSlug}/${id ?? 'create'}`,
      }),
    [config.routes.admin],
  )

  const showSaved = useCallback(
    ({ id, collectionSlug }: { collectionSlug: string; id: number | string }) => {
      // Persistent so keyboard and screen-reader users can reach the action (WCAG 2.2.1).
      toast.success(t('upload:uploadSavedInBackground'), {
        action: {
          label: t('general:open'),
          onClick: () => router.push(getDocumentURL({ id, collectionSlug })),
        },
        closeButton: true,
        duration: Infinity,
      })
    },
    [getDocumentURL, router, t],
  )

  const showReadyToFinish = useCallback(
    ({ session }: { session: ClientUploadSession }) => {
      const url = `${getDocumentURL({
        id: session.targetID ?? undefined,
        collectionSlug: session.collectionSlug,
      })}?uploadSession=${session.id}`

      toast.info(t('upload:uploadReadyToFinishSaving', { filename: session.file.filename }), {
        action: { label: t('upload:finishSaving'), onClick: () => router.push(url) },
        closeButton: true,
        duration: Infinity,
      })
    },
    [getDocumentURL, router, t],
  )

  /** Called once storage is complete for an upload whose form is gone. */
  const finishInBackground = useCallback(
    async ({
      intentRequest,
      session,
    }: {
      intentRequest?: Promise<unknown>
      session: ClientUploadSession
    }) => {
      await intentRequest?.catch(() => {})

      if (!session.hasIntent) {
        showReadyToFinish({ session })
        return
      }

      try {
        const { doc } = await completeUploadSession({ id: session.id, ...requestArgs })

        showSaved({ id: doc.id, collectionSlug: session.collectionSlug })
      } catch (err) {
        toast.error(getErrorMessage(err), {
          action: {
            label: t('upload:finishSaving'),
            onClick: () =>
              router.push(
                `${getDocumentURL({
                  id: session.targetID ?? undefined,
                  collectionSlug: session.collectionSlug,
                })}?uploadSession=${session.id}`,
              ),
          },
          duration: Infinity,
        })
      }
    },
    [getDocumentURL, getErrorMessage, requestArgs, router, showReadyToFinish, showSaved, t],
  )

  const start = useCallback<UploadSessionsContext['start']>(
    ({ collectionSlug, file, targetID }) => {
      const collectionConfig = getEntityConfig({ collectionSlug })

      if (!collectionConfig || !shouldUseUploadSession({ collectionConfig, file })) {
        return false
      }

      const controller = new AbortController()
      const toastID = `upload-session-${crypto.randomUUID()}`
      let detach: UploadEntry['detach'] = () => {}
      const detached = new Promise<never>((_, reject) => {
        detach = reject
      })

      // Avoid unhandled rejections when nothing is waiting on the upload.
      detached.catch(() => {})

      const session = createUploadSession({
        collectionSlug,
        file,
        signal: controller.signal,
        targetID,
        ...requestArgs,
      })

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
        targetID,
        toastID,
      }

      entriesRef.current.set(file, entry)
      progress.show(t('upload:uploadingFile', { filename: file.name }))

      uploadedFile.then(
        async () => {
          entry.isSettled = true
          releaseWaitingSave(entry)
          toast.dismiss(toastID)

          if (!entry.isAttached) {
            entriesRef.current.delete(entry.formFile)
            await finishInBackground({
              intentRequest: entry.intentRequest,
              session: { ...(await session), hasIntent: entry.hasIntent },
            })
          }
        },
        (err: unknown) => {
          entry.isSettled = true
          releaseWaitingSave(entry)
          entriesRef.current.delete(entry.formFile)

          if (controller.signal.aborted) {
            toast.dismiss(toastID)
            return
          }

          toast.error(
            `${t('upload:uploadInterrupted', { filename: file.name })} ${getErrorMessage(err)}`,
            { id: toastID, duration: Infinity },
          )
        },
      )

      return true
    },
    [finishInBackground, getEntityConfig, releaseWaitingSave, requestArgs],
  )

  const cancel = useCallback<UploadSessionsContext['cancel']>(
    ({ file }) => {
      const entry = entriesRef.current.get(file)

      if (!entry) {
        return
      }

      entriesRef.current.delete(file)
      entry.controller.abort()
      releaseWaitingSave(entry)
      toast.dismiss(entry.toastID)

      void entry.session
        .then(({ id }) => cancelUploadSession({ id, ...requestArgs }))
        .catch(() => {})
    },
    [releaseWaitingSave, requestArgs],
  )

  const rekey = useCallback<UploadSessionsContext['rekey']>(({ from, to }) => {
    const entry = entriesRef.current.get(from)

    if (entry) {
      entriesRef.current.delete(from)
      entry.formFile = to
      entriesRef.current.set(to, entry)
    }
  }, [])

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

      entriesRef.current.delete(file)

      // Uploaded but never saved: offer a way back to the form without re-uploading.
      if (!entry.isWaitedOn) {
        void entry.session.then((session) => showReadyToFinish({ session }))
      }
    },
    [showReadyToFinish],
  )

  const getUploadedFile = useCallback<UploadSessionsContext['getUploadedFile']>(
    ({ file, intent }) => {
      const entry = entriesRef.current.get(file)

      if (!entry) {
        return null
      }

      entry.isWaitedOn = true

      if (intent && !entry.isSettled) {
        if (!entry.isCountedAsWaitingSave) {
          entry.isCountedAsWaitingSave = true
          setWaitingSaveCount((count) => count + 1)
        }

        entry.hasIntent = true
        entry.intentRequest = entry.session
          .then(({ id }) => setUploadSessionIntent({ id, intent, ...requestArgs }))
          .catch(() => {
            entry.hasIntent = false
          })
      }

      return Promise.race([entry.file, entry.detached])
    },
    [requestArgs],
  )

  const adoptionsRef = useRef(new Map<string, Promise<File | null>>())

  const adoptSession = useCallback(
    async ({ sessionID }: { sessionID: string }): Promise<File | null> => {
      const session = await getUploadSession({ id: sessionID, ...requestArgs }).catch(() => null)

      if (!session?.isStorageComplete || session.status === 'completed') {
        return null
      }

      // The bytes are already in storage, so the form only needs a stand-in with the right name.
      const placeholder = new File([], session.file.filename, { type: session.file.mimeType })
      const uploadedFile = getUploadSessionFile({ id: session.id, ...requestArgs })

      uploadedFile.catch(() => {})

      entriesRef.current.set(placeholder, {
        collectionSlug: session.collectionSlug as UploadCollectionSlug,
        controller: new AbortController(),
        detach: () => {},
        detached: new Promise<never>(() => {}),
        file: uploadedFile,
        formFile: placeholder,
        hasIntent: session.hasIntent,
        isAttached: true,
        isSettled: true,
        isWaitedOn: false,
        session: Promise.resolve(session),
        targetID: session.targetID ?? undefined,
        toastID: `upload-session-${session.id}`,
      })

      return placeholder
    },
    [requestArgs],
  )

  /** Reuses one adoption per session, e.g. when a dev-mode effect runs twice. */
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

  useBeforeUnload(
    () => [...entriesRef.current.values()].some(({ isSettled }) => !isSettled),
    t('upload:uploadInProgressLeaveWarning'),
  )

  useRecoverUploadSessions({ finishInBackground, getErrorMessage, requestArgs })

  const isSaveContinuingInBackground = waitingSaveCount > 0

  const value = useMemo(
    () => ({
      adopt,
      cancel,
      detach,
      getUploadedFile,
      isSaveContinuingInBackground,
      isUploading,
      rekey,
      start,
    }),
    [
      adopt,
      cancel,
      detach,
      getUploadedFile,
      isSaveContinuingInBackground,
      isUploading,
      rekey,
      start,
    ],
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

/**
 * After a reload or browser restart, offers to resume each unfinished upload. The browser cannot
 * reopen the original file on its own, so the user reselects it; only missing segments are sent.
 */
const useRecoverUploadSessions = ({
  finishInBackground,
  getErrorMessage,
  requestArgs,
}: {
  finishInBackground: (args: { session: ClientUploadSession }) => Promise<void>
  getErrorMessage: (err: unknown) => string
  requestArgs: { apiRoute: string; serverURL: string }
}) => {
  const { config } = useConfig()
  const { t } = useTranslation()
  const hasCheckedRef = useRef(false)

  const hasSegmentedCollections = config.collections.some(
    ({ upload }) => upload?.uploadInstructions?.supportsSegmentedUploads,
  )

  useEffect(() => {
    if (!hasSegmentedCollections || hasCheckedRef.current) {
      return
    }

    hasCheckedRef.current = true

    void listUploadSessions(requestArgs)
      .then((sessions) => {
        for (const session of sessions) {
          if (session.isStorageComplete) {
            void finishInBackground({ session })
            continue
          }

          const toastID = `upload-session-recovery-${session.id}`

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
                        session,
                        ...requestArgs,
                      })
                        .then(() => {
                          toast.dismiss(toastID)
                          return finishInBackground({ session })
                        })
                        .catch((err: unknown) => toast.error(getErrorMessage(err), { id: toastID }))
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
  }, [finishInBackground, getErrorMessage, hasSegmentedCollections, requestArgs, t])
}

/**
 * An auto-updating progress toast the user can hide (WCAG 2.2.2). Once closed it stays hidden
 * while the upload carries on; completion and errors still show their own toasts.
 */
const createProgressToast = ({ id }: { id: string }) => {
  let isHidden = false

  return {
    show: (message: string) => {
      if (!isHidden) {
        toast.loading(message, {
          id,
          closeButton: true,
          onDismiss: () => {
            isHidden = true
          },
        })
      }
    },
  }
}

const pickFile = ({ accept, onPick }: { accept?: string; onPick: (file: File) => void }) => {
  const input = document.createElement('input')

  input.type = 'file'
  input.accept = accept ?? ''
  input.hidden = true
  input.onchange = () => {
    const file = input.files?.[0]

    input.remove()

    if (file) {
      onPick(file)
    }
  }
  input.oncancel = () => input.remove()
  // Attached so every browser treats it as a regular file chooser.
  document.body.append(input)
  input.click()
}
