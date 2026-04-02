'use client'

import { LoadingOverlay, useRouter, useServerFunctions } from '@payloadcms/ui'
import { notFound } from '@tanstack/react-router'
import React from 'react'

import type { SerializablePageState } from '../Root/types.js'

import { buildRenderCollectionFolderArgs } from '../buildRenderViewArgs.js'
import { getRedirectURL, isNotFoundError, UnsupportedView } from '../shared.js'

export function CollectionFoldersView({ pageState }: { pageState: SerializablePageState }) {
  const { serverFunction } = useServerFunctions()
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(true)
  const [isNotFoundRoute, setIsNotFoundRoute] = React.useState(false)
  const [folderView, setFolderView] = React.useState<null | React.ReactNode>(null)

  if (isNotFoundRoute) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw notFound()
  }

  React.useEffect(() => {
    if (!pageState.routeParams.collection) {
      return
    }

    let cancelled = false

    const run = async () => {
      try {
        const result = (await serverFunction({
          name: 'render-collection-folder',
          args: buildRenderCollectionFolderArgs({ pageState }),
        })) as { View?: React.ReactNode }

        if (!cancelled) {
          setFolderView(result?.View ?? null)
          setIsLoading(false)
        }
      } catch (error) {
        if (cancelled) {
          return
        }

        const redirectURL = getRedirectURL(error)

        if (redirectURL) {
          router.replace(redirectURL)
          return
        }

        if (isNotFoundError(error)) {
          setIsNotFoundRoute(true)
          return
        }

        setFolderView(
          <UnsupportedView
            description="TanStack collection-folder view failed to render."
            title="Unsupported View"
          />,
        )
        setIsLoading(false)
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [pageState, router, serverFunction])

  if (!pageState.routeParams.collection || isLoading) {
    return <LoadingOverlay />
  }

  return folderView
}
