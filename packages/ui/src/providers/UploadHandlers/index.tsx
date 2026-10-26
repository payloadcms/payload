'use client'
import type { UploadCollectionSlug, UploadInstructions } from 'payload'

import { formatAdminURL } from 'payload/shared'
import React from 'react'

import type { UploadSessionIntentData } from '../../utilities/uploadWithSession.js'

import { shouldUseUploadSession, uploadWithSession } from '../../utilities/uploadWithSession.js'
import { useConfig } from '../Config/index.js'
import { useUploadSessions } from '../UploadSessions/index.js'

type UploadHandler = (args: {
  docPrefix?: string
  file: File
  /** The document data being saved, kept with a running upload so the save survives navigation. */
  intent?: UploadSessionIntentData
}) => Promise<UploadInstructions['file']>

export type UploadHandlersContext = {
  getUploadHandler: (args: { collectionSlug: UploadCollectionSlug }) => null | UploadHandler
}

const Context = React.createContext<null | UploadHandlersContext>(null)

export const UploadHandlersProvider = ({ children }) => {
  const { config, getEntityConfig } = useConfig()
  const uploadSessions = useUploadSessions()
  const uploadInstructionsURL = formatAdminURL({
    apiRoute: config.routes.api,
    path: '/upload-instructions',
    serverURL: config.serverURL,
  })
  const getUploadHandler: UploadHandlersContext['getUploadHandler'] = ({ collectionSlug }) => {
    const collectionConfig = getEntityConfig({ collectionSlug })

    if (!collectionConfig?.upload?.uploadInstructions.useInAdmin) {
      return null
    }

    return async ({ docPrefix, file, intent }) => {
      // The upload may already be running since the file was picked; the save waits for it.
      const runningUpload = uploadSessions.getUploadedFile({ file, intent })

      if (runningUpload !== null) {
        return runningUpload
      }

      if (shouldUseUploadSession({ collectionConfig, file })) {
        return uploadWithSession({
          apiRoute: config.routes.api,
          collectionSlug,
          docPrefix,
          file,
          serverURL: config.serverURL,
        })
      }

      const response = await fetch(uploadInstructionsURL, {
        body: JSON.stringify({
          collectionSlug,
          docPrefix,
          filename: file.name,
          filesize: file.size,
          mimeType: file.type,
        }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })

      if (!response.ok) {
        const { errors } = (await response.json()) as { errors: { message: string }[] }
        throw new Error(errors.map(({ message }) => message).join(', '))
      }

      const instructions = (await response.json()) as UploadInstructions
      let uploadedFile = instructions.file

      if (instructions.type === 'http') {
        const { url, ...request } = instructions.request
        const upload = await fetch(url, { body: file, ...request })

        if (!upload.ok) {
          throw new Error(`Upload failed with status ${upload.status}`)
        }

        return uploadedFile
      }

      const result = await new Promise<unknown>((resolve, reject) => {
        const event = new CustomEvent(`payload:upload:${instructions.name}`, {
          cancelable: true,
          detail: {
            collectionSlug,
            data: instructions.data,
            docPrefix,
            file,
            reject,
            resolve,
            updateFilename: (filename: string) => {
              uploadedFile = { ...uploadedFile, filename }
            },
          },
        })

        if (window.dispatchEvent(event)) {
          reject(new Error(`Unsupported upload instruction: ${instructions.name}`))
        }
      })

      return typeof result === 'object' && result !== null
        ? { ...uploadedFile, uploadReference: result as Record<string, unknown> }
        : uploadedFile
    }
  }

  return <Context value={{ getUploadHandler }}>{children}</Context>
}

export const useUploadHandlers = (): UploadHandlersContext => {
  const context = React.use(Context)

  if (context === null) {
    throw new Error('useUploadHandlers must be used within UploadHandlersProvider')
  }

  return context
}
