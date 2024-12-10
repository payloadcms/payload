import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime.js'

import { formatAdminURL } from './formatAdminURL.js'

type GoBackProps = {
  adminRoute: string
  collectionSlug: string
  router: AppRouterInstance
}

export const handleGoBack = ({ adminRoute, collectionSlug, router }: GoBackProps) => {
  const redirectRoute = formatAdminURL({
    adminRoute,
    path: collectionSlug ? `/collections/${collectionSlug}` : '/',
  })
  router.push(redirectRoute)
}
