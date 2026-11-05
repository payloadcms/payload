import type { RouterAdapterRouter } from 'payload'

import { formatAdminURL } from 'payload/shared'

type BackToDashboardProps = {
  adminRoute: string
  router: RouterAdapterRouter
  serverURL?: string
}

export const handleBackToDashboard = ({ adminRoute, router, serverURL }: BackToDashboardProps) => {
  const redirectRoute = formatAdminURL({
    adminRoute,
    path: '',
    serverURL,
  })
  router.push(redirectRoute)
}
