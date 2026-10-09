'use client'

import type { NotFoundRouteProps } from '@tanstack/react-router'

import { NotFoundClient, useRouteTransition } from '@payloadcms/ui'
import { useLoaderData } from '@tanstack/react-router'
import { Fragment, type ReactNode, useDeferredValue, useEffect } from 'react'

export function AdminPage() {
  // Note: React key intentionally omitted here so the persistent template (nav, header) doesn't remount and flash on navigation.
  // The per-route view key is attached server-side to the view subtree instead, via `renderRoot`'s `key` in `loadAdminPage`.
  const data = useLoaderData({ strict: false })

  // Route state comes from an external store, so a new RSC payload that suspends
  // on code-split client references can reveal the router's null fallback.
  // Keep the current payload painted until the next one is renderable.
  const rscPayload = useDeferredValue(data?.rscPayload)
  const { holdRouteTransition } = useRouteTransition()
  const isRscPayloadDeferred = rscPayload !== data?.rscPayload

  useEffect(() => {
    if (!isRscPayloadDeferred) {
      return
    }

    const releaseRouteTransition = holdRouteTransition()

    return () => releaseRouteTransition()
  }, [holdRouteTransition, isRscPayloadDeferred])

  return <Fragment>{rscPayload}</Fragment>
}

type AdminNotFoundData = { routeKey?: string; rscPayload?: ReactNode }

export function AdminNotFound({ data }: NotFoundRouteProps) {
  // TanStack exposes not-found data as unknown; this route only receives the shape thrown below.
  const { routeKey, rscPayload } = (data ?? {}) as AdminNotFoundData
  if (!rscPayload) {
    return <NotFoundClient />
  }
  return <Fragment key={routeKey}>{rscPayload}</Fragment>
}
