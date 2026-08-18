'use client'
import type { UploadCollectionSlug, UploadInstructions } from 'payload'

import { formatAdminURL } from 'payload/shared'
import React from 'react'

import { useConfig } from '../Config/index.js'

type UploadHandler = (args: {
  docPrefix?: string
  file: File
}) => Promise<UploadInstructions['file']>

export type UploadHandlersContext = {
  getUploadHandler: (args: { collectionSlug: UploadCollectionSlug }) => null | UploadHandler
}

const Context = React.createContext<null | UploadHandlersContext>(null)

export const UploadHandlersProvider = ({ children }) => {
  const { config, getEntityConfig } = useConfig()
  const uploadInstructionsURL = formatAdminURL({
    apiRoute: config.routes.api,
    path: '/upload-instructions',
    serverURL: config.serverURL,
  })
  const getUploadHandler: UploadHandlersContext['getUploadHandler'] = ({ collectionSlug }) => {
    if (!getEntityConfig({ collectionSlug })?.upload?.uploadInstructions.useInAdmin) {
      return null
    }

    return async ({ docPrefix, file }) => {
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
