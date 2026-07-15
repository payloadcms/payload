'use client'

import type { UploadCollectionSlug } from 'payload'

import { useConfig, useEffectEvent } from '@payloadcms/ui'
import { Fragment, type ReactNode, useEffect } from 'react'

type ClientUploadHandlerProps<T extends Record<string, unknown>> = {
  children: ReactNode
  collectionSlug: UploadCollectionSlug
  endpointPath?: `/${string}`
  prefix?: string
  props: T
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
    endpointPath?: `/${string}`
    file: File
    prefix?: string
    props: T
    serverURL: string
    updateFilename: (value: string) => void
  }) => Promise<unknown>
  name: string
}) => {
  return function ClientUploadHandler({
    children,
    collectionSlug,
    endpointPath,
    prefix,
    props,
  }: ClientUploadHandlerProps<T>) {
    const {
      config: {
        routes: { api: apiRoute },
        serverURL,
      },
    } = useConfig()

    const initializeHandler = useEffectEvent(() => {
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
          endpointPath,
          file: customEvent.detail.file,
          prefix,
          props,
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
