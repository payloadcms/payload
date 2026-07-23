import type { RouterAdapterRouter } from 'payload'

import { formatAdminURL } from 'payload/shared'

type GoBackProps = {
  adminRoute: string
  collectionSlug: string
  router: RouterAdapterRouter
  serverURL?: string
}

export const handleGoBack = ({ adminRoute, collectionSlug, router, serverURL }: GoBackProps) => {
  const redirectRoute = formatAdminURL({
    adminRoute,
    path: collectionSlug ? `/collections/${collectionSlug}` : '/',
  })
  void router.push(redirectRoute)
}
