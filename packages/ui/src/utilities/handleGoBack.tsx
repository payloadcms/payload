import { formatAdminURL } from 'payload/shared'

import type { RouterInstance } from '../providers/Router/types.js'

type GoBackProps = {
  adminRoute: string
  collectionSlug: string
  router: RouterInstance
  serverURL?: string
}

export const handleGoBack = ({ adminRoute, collectionSlug, router, serverURL }: GoBackProps) => {
  const redirectRoute = formatAdminURL({
    adminRoute,
    path: collectionSlug ? `/collections/${collectionSlug}` : '/',
  })
  router.push(redirectRoute)
}
