import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime.js'

import { formatAdminURL } from 'payload/shared'

type GoBackProps = {
  adminRoute: string
  collectionSlug: string
  router: AppRouterInstance
  serverURL?: string
}

export const handleGoBack = ({ adminRoute, collectionSlug, router, serverURL }: GoBackProps) => {
  const redirectRoute = formatAdminURL({
    adminRoute,
    path: collectionSlug ? `/collections/${collectionSlug}` : '/',
  })
  router.push(redirectRoute)
}
