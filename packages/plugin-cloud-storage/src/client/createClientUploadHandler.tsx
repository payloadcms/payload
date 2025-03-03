'use client'

import type { UploadCollectionSlug } from 'payload'

import { useConfig, useEffectEvent, useUploadHandlers } from '@payloadcms/ui'
import { Fragment, type ReactNode, useEffect } from 'react'

type ClientUploadHandlerProps<T extends Record<string, unknown>> = {
  children: ReactNode
  collectionSlug: UploadCollectionSlug
  enabled?: boolean
  extra: T
  prefix?: string
  serverHandlerPath: string
}

export const createClientUploadHandler = <T extends Record<string, unknown>>({
  handler,
}: {
  handler: (args: {
    apiRoute: string
    collectionSlug: UploadCollectionSlug
    extra: T
    file: File
    prefix?: string
    serverHandlerPath: string
    serverURL: string
    updateFilename: (value: string) => void
  }) => Promise<unknown>
}) => {
  return function ClientUploadHandler({
    children,
    collectionSlug,
    enabled,
    extra,
    prefix,
    serverHandlerPath,
  }: ClientUploadHandlerProps<T>) {
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
              apiRoute,
              collectionSlug,
              extra,
              file,
              prefix,
              serverHandlerPath,
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
