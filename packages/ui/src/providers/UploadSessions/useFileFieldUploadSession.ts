'use client'
import type { UploadCollectionSlug } from 'payload'

import { useCallback, useEffect, useRef } from 'react'

import { useDocumentInfo } from '../DocumentInfo/index.js'
import { useSearchParams } from '../RouterAdapter/index.js'
import { useUploadSessions } from './index.js'

/**
 * Connects a document's file field to the upload coordinator: large files start uploading as soon
 * as they are picked, removing or replacing the file cancels the upload, renaming keeps it, and
 * leaving the form hands it to the coordinator. A `?uploadSession=` link attaches an upload whose
 * bytes are already in storage.
 */
export const useFileFieldUploadSession = ({
  collectionSlug,
  isEnabled = true,
  onAdopt,
}: {
  collectionSlug: string
  isEnabled?: boolean
  /** Receives a stand-in file for an attached upload, to put in the form's file field. */
  onAdopt: (file: File) => void
}): { onFileChange: (args: { file: File | null; isNewFile: boolean }) => void } => {
  const { id } = useDocumentInfo()
  const uploadSessions = useUploadSessions()
  /**
   * The context value changes when a save starts waiting on an upload. Effects read the latest
   * value from this ref so that change never looks like the form unmounting.
   */
  const uploadSessionsRef = useRef(uploadSessions)
  uploadSessionsRef.current = uploadSessions
  const searchParams = useSearchParams()
  const sessionFileRef = useRef<File | null>(null)
  /** Counts file selections, so an attached upload that arrives after the user picked a file is dropped. */
  const selectionCountRef = useRef(0)
  const adoptedSessionID = isEnabled ? searchParams.get('uploadSession') : null

  const onFileChange = useCallback(
    ({ file, isNewFile }: { file: File | null; isNewFile: boolean }) => {
      if (!isEnabled) {
        return
      }

      selectionCountRef.current += 1

      const uploadSessions = uploadSessionsRef.current

      if (!isNewFile && file && sessionFileRef.current) {
        uploadSessions.rekey({ from: sessionFileRef.current, to: file })
        sessionFileRef.current = file
        return
      }

      if (sessionFileRef.current === file) {
        return
      }

      if (sessionFileRef.current) {
        uploadSessions.cancel({ file: sessionFileRef.current })
      }

      sessionFileRef.current =
        file &&
        uploadSessions.start({
          collectionSlug,
          file,
          targetID: id,
        })
          ? file
          : null
    },
    [collectionSlug, id, isEnabled],
  )

  useEffect(() => {
    if (!adoptedSessionID || sessionFileRef.current) {
      return
    }

    let isCancelled = false
    const selectionCount = selectionCountRef.current

    void uploadSessionsRef.current.adopt({ sessionID: adoptedSessionID }).then((placeholder) => {
      if (!placeholder || isCancelled) {
        return
      }

      // The user picked a file meanwhile. Detaching keeps the session recoverable.
      if (selectionCount !== selectionCountRef.current) {
        uploadSessionsRef.current.detach({ file: placeholder })
        return
      }

      sessionFileRef.current = placeholder
      onAdopt(placeholder)
    })

    return () => {
      isCancelled = true
    }
  }, [adoptedSessionID, onAdopt])

  useEffect(
    () => () => {
      if (sessionFileRef.current) {
        uploadSessionsRef.current.detach({ file: sessionFileRef.current })
      }
    },
    [],
  )

  return { onFileChange }
}
