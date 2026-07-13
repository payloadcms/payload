'use client'

import type { UploadCollectionSlug } from 'payload'

import { useConfig, useEffectEvent } from '@payloadcms/ui'
import { Fragment, type ReactNode, useEffect } from 'react'

type ClientUploadHandlerProps<T extends Record<string, unknown>> = {
  children: ReactNode
  collectionSlug: UploadCollectionSlug
  enabled?: boolean
  extra: T
  prefix?: string
  serverHandlerPath: `/${string}`
}

export const createClientUploadHandler = <T extends Record<string, unknown>>({
  name,
  handler,
}: {
  handler: (args: {
    apiRoute: string
    collectionSlug: UploadCollectionSlug
    data?: unknown
    docPrefix?: string
    extra: T
    file: File
    prefix?: string
    serverHandlerPath: `/${string}`
    serverURL: string
    updateFilename: (value: string) => void
  }) => Promise<unknown>
  name: string
}) => {
  return function ClientUploadHandler({
    children,
    collectionSlug,
    enabled,
    extra,
    prefix,
    serverHandlerPath,
  }: ClientUploadHandlerProps<T>) {
    const {
      config: {
        routes: { api: apiRoute },
        serverURL,
      },
    } = useConfig()

    const initializeHandler = useEffectEvent(() => {
      if (!enabled) {
        return
      }

      const listener = (event: Event) => {
        const customEvent = event as CustomEvent<{
          collectionSlug: UploadCollectionSlug
          data?: unknown
          docPrefix?: string
          file: File
          reject: (reason?: unknown) => void
          resolve: (value: unknown) => void
          updateFilename: (value: string) => void
        }>

        if (customEvent.detail.collectionSlug !== collectionSlug) {
          return
        }

        customEvent.preventDefault()
        void handler({
          apiRoute,
          collectionSlug,
          data: customEvent.detail.data,
          docPrefix: customEvent.detail.docPrefix,
          extra,
          file: customEvent.detail.file,
          prefix,
          serverHandlerPath,
          serverURL,
          updateFilename: customEvent.detail.updateFilename,
        }).then(customEvent.detail.resolve, customEvent.detail.reject)
      }

      const eventName = `payload:upload:${name}`
      const eventTarget = globalThis as unknown as EventTarget
      eventTarget.addEventListener(eventName, listener)
      return () => eventTarget.removeEventListener(eventName, listener)
    })

    useEffect(() => {
      return initializeHandler()
    }, [])

    return <Fragment>{children}</Fragment>
  }
}
