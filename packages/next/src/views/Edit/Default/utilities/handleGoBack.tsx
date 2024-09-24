import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime.js'

import { formatAdminURL } from '@payloadcms/ui/shared'

type GoBackProps = {
  adminRoute: string
  collectionSlug: string | undefined
  router: AppRouterInstance
}

export const handleGoBack = ({ adminRoute, collectionSlug, router }: GoBackProps) => {
  const redirectRoute = formatAdminURL({
    adminRoute,
    path: collectionSlug ? `/collections/${collectionSlug}` : '/',
  })
  router.push(redirectRoute)
}
