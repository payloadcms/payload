'use client'

import type { UploadCollectionSlug } from 'payload'

import { useConfig, useEffectEvent, useUploadHandlers } from '@payloadcms/ui'
import { Fragment, type ReactNode, useEffect } from 'react'

export const createClientUploadHandler = ({
  handler,
}: {
  handler: (args: {
    apiRoute: string
    collectionSlug: UploadCollectionSlug
    file: File
    serverURL: string
  }) => Promise<void>
}) => {
  return ({
    children,
    collectionSlug,
  }: {
    children: ReactNode
    collectionSlug: UploadCollectionSlug
  }) => {
    const { setUploadHandler } = useUploadHandlers()
    const {
      config: {
        routes: { api: apiRoute },
        serverURL,
      },
    } = useConfig()

    const initializeHandler = useEffectEvent(() => {
      setUploadHandler({
        collectionSlug,
        handler: ({ file }) => {
          return handler({ apiRoute, collectionSlug, file, serverURL })
        },
      })
    })

    useEffect(() => {
      initializeHandler()
    }, [])

    return <Fragment>{children}</Fragment>
  }
}
