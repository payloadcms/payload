'use client'

import { useRouter, useRouteTransition, useSearchParams } from '@payloadcms/ui'
import { useEffect } from 'react'

export const GlobalViewRedirectClient = ({ redirectRoute }: { redirectRoute: string }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { startRouteTransition } = useRouteTransition()

  useEffect(() => {
    // Retry if the list view syncs its query to the URL and interrupts the redirect.
    startRouteTransition(() => router.replace(redirectRoute))
  }, [redirectRoute, router, searchParams, startRouteTransition])

  return null
}
