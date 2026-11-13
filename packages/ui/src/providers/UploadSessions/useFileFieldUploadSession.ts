'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useForm } from '../../forms/Form/index.js'
import { useDocumentInfo } from '../DocumentInfo/index.js'
import { useSearchParams } from '../RouterAdapter/index.js'
import { useOptionalUploadSessions } from './index.js'

/**
 * Connects a document's file field to the upload coordinator: large files start uploading as soon
 * as they are picked, removing or replacing the file cancels the upload, and leaving the form
 * hands it to the coordinator. A `?uploadSession=` link attaches an upload whose
 * bytes are already in storage.
 */
export const useFileFieldUploadSession = ({
  collectionSlug,
  hasStoredFile,
  isEnabled = true,
  setFilename,
  setRemovedFile,
  setValue,
}: {
  collectionSlug: string
  /** Whether the document already has a stored file, which an attached upload then replaces. */
  hasStoredFile: boolean
  isEnabled?: boolean
  setFilename: (filename: string) => void
  setRemovedFile: (isRemoved: boolean) => void
  /** Sets the form's file field. */
  setValue: (file: File) => void
}): {
  /**
   * Whether the selected file uploads through a session. Storage keeps the object under the name
   * it started with, so the form locks the file name instead of sending the whole file again.
   */
  hasUploadSession: boolean
  onFileChange: (args: { file: File | null; isNewFile: boolean }) => void
} => {
  const { id } = useDocumentInfo()
  const { getDataByPath } = useForm()
  // `Upload` is a public export, so it can render outside the Admin. Without the provider, files
  // upload with the form as before.
  const uploadSessions = useOptionalUploadSessions()
  const canUseSessions = isEnabled && uploadSessions !== null
  /**
   * The context value changes when a save starts waiting on an upload. Effects read the latest
   * value from this ref so that change never looks like the form unmounting.
   */
  const uploadSessionsRef = useRef(uploadSessions)
  uploadSessionsRef.current = uploadSessions
  const searchParams = useSearchParams()
  const sessionFileRef = useRef<File | null>(null)
  const [hasUploadSession, setHasUploadSession] = useState(false)
  const setSessionFile = useCallback((file: File | null) => {
    sessionFileRef.current = file
    setHasUploadSession(file !== null)
  }, [])
  /** Counts file selections, so an attached upload that arrives after the user picked a file is dropped. */
  const selectionCountRef = useRef(0)
  const adoptedSessionID = canUseSessions ? searchParams.get('uploadSession') : null

  const onFileChange = useCallback(
    ({ file, isNewFile }: { file: File | null; isNewFile: boolean }) => {
      const uploadSessions = uploadSessionsRef.current

      if (!canUseSessions || !uploadSessions) {
        return
      }

      selectionCountRef.current += 1

      if (sessionFileRef.current === file) {
        return
      }

      if (sessionFileRef.current) {
        uploadSessions.cancel({ file: sessionFileRef.current })
      }

      setSessionFile(
        file &&
          uploadSessions.start({
            collectionSlug,
            docPrefix: getDocPrefix({ prefix: getDataByPath('prefix') }),
            file,
            targetID: id,
          })
          ? file
          : null,
      )
    },
    [canUseSessions, collectionSlug, getDataByPath, id, setSessionFile],
  )

  const onAdopt = useCallback(
    (file: File) => {
      // An attached upload replacing a stored file shows like a picked replacement.
      if (hasStoredFile) {
        setRemovedFile(true)
      }

      setValue(file)
      setFilename(file.name)
    },
    [hasStoredFile, setFilename, setRemovedFile, setValue],
  )

  useEffect(() => {
    const uploadSessions = uploadSessionsRef.current

    if (!adoptedSessionID || !uploadSessions || sessionFileRef.current) {
      return
    }

    let isCancelled = false
    const selectionCount = selectionCountRef.current

    void uploadSessions.adopt({ sessionID: adoptedSessionID }).then((placeholder) => {
      if (!placeholder || isCancelled) {
        return
      }

      // The user picked a file meanwhile. Detaching keeps the session recoverable.
      if (selectionCount !== selectionCountRef.current) {
        uploadSessionsRef.current?.detach({ file: placeholder })
        return
      }

      setSessionFile(placeholder)
      onAdopt(placeholder)
    })

    return () => {
      isCancelled = true
    }
  }, [adoptedSessionID, onAdopt, setSessionFile])

  useEffect(
    () => () => {
      if (sessionFileRef.current) {
        uploadSessionsRef.current?.detach({ file: sessionFileRef.current })
      }
    },
    [],
  )

  return { hasUploadSession, onFileChange }
}

/** Matches the prefix a save sends with its file, so storage places the object the same way. */
const getDocPrefix = ({ prefix }: { prefix: unknown }): string | undefined =>
  typeof prefix === 'string' ? prefix : undefined
