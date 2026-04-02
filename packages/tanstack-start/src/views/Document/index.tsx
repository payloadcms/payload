'use client'

import { LoadingOverlay, useRouter, useServerFunctions } from '@payloadcms/ui'
import { notFound } from '@tanstack/react-router'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import type { SerializablePageState } from '../Root/types.js'

import { buildRenderDocumentArgs } from '../buildRenderViewArgs.js'
import { getRedirectURL, isNotFoundError, UnsupportedView } from '../shared.js'

export function DocumentView({ pageState }: { pageState: SerializablePageState }) {
  const { renderDocument } = useServerFunctions()
  const router = useRouter()
  const [documentView, setDocumentView] = React.useState<null | React.ReactNode>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isNotFoundRoute, setIsNotFoundRoute] = React.useState(false)

  if (isNotFoundRoute) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw notFound()
  }

  React.useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        const result = await renderDocument(
          buildRenderDocumentArgs({
            pageState,
          }),
        )

        if (cancelled) {
          return
        }

        if (
          pageState.routeParams.collection &&
          !pageState.routeParams.id &&
          result?.data &&
          typeof result.data === 'object' &&
          'id' in result.data &&
          result.data.id
        ) {
          router.replace(
            formatAdminURL({
              adminRoute: pageState.clientConfig.routes.admin,
              path: `/collections/${pageState.routeParams.collection}/${String(result.data.id)}`,
            }),
          )
          return
        }

        setDocumentView(result?.Document ?? null)
        setIsLoading(false)
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

        setDocumentView(
          <UnsupportedView
            description="TanStack document view failed to render."
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
  }, [pageState, renderDocument, router])

  if (isLoading) {
    return <LoadingOverlay />
  }

  return documentView
}
