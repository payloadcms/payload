'use client'

import type { ListQuery } from 'payload'

import {
  LoadingOverlay,
  parseSearchParams,
  useRouter,
  useSearchParams,
  useServerFunctions,
} from '@payloadcms/ui'
import { notFound } from '@tanstack/react-router'
import React from 'react'

import type { SerializablePageState } from '../Root/types.js'

import { buildRenderListArgs } from '../buildRenderViewArgs.js'
import { getRedirectURL, isNotFoundError, UnsupportedView } from '../shared.js'

export function ListView({ pageState }: { pageState: SerializablePageState }) {
  const { serverFunction } = useServerFunctions()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = React.useState(true)
  const [isNotFoundRoute, setIsNotFoundRoute] = React.useState(false)
  const [listView, setListView] = React.useState<null | React.ReactNode>(null)

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
          name: 'render-list',
          args: buildRenderListArgs({
            pageState,
            query: parseSearchParams(searchParams) as ListQuery,
          }),
        })) as { List?: React.ReactNode }

        if (!cancelled) {
          setListView(result?.List ?? null)
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

        setListView(
          <UnsupportedView
            description="TanStack list view failed to render."
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
  }, [pageState, router, searchParams, serverFunction])

  if (!pageState.routeParams.collection || isLoading) {
    return <LoadingOverlay />
  }

  return listView
}
