'use client'

import type { UploadCollectionSlug } from 'payload'

import { useConfig, useEffectEvent, useUploadHandlers } from '@payloadcms/ui'
import { Fragment, type ReactNode, useEffect } from 'react'

export const createClientUploadHandler = ({
  handler,
}: {
  handler: (args: {
    addRandomSuffix?: boolean
    apiRoute: string
    baseURL?: string
    collectionSlug: UploadCollectionSlug
    file: File
    prefix?: string
    serverURL: string
    updateFilename: (value: string) => void
  }) => Promise<void>
}) => {
  return function ClientUploadHandler({
    addRandomSuffix,
    baseURL,
    children,
    collectionSlug,
    enabled,
    prefix,
  }: {
    addRandomSuffix?: boolean
    baseURL?: string
    children: ReactNode
    collectionSlug: UploadCollectionSlug
    enabled?: boolean
    prefix?: string
  }) {
    const { setUploadHandler } = useUploadHandlers()
    const {
      config: {
        routes: { api: apiRoute },
        serverURL,
      },
    } = useConfig()

    const initializeHandler = useEffectEvent(() => {
      if (enabled) {
        setUploadHandler({
          collectionSlug,
          handler: ({ file, updateFilename }) => {
            return handler({
              addRandomSuffix,
              apiRoute,
              baseURL,
              collectionSlug,
              file,
              prefix,
              serverURL,
              updateFilename,
            })
          },
        })
      }
    })

    useEffect(() => {
      initializeHandler()
    }, [])

    return <Fragment>{children}</Fragment>
  }
}
