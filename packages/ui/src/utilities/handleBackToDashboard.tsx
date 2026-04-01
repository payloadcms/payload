import { formatAdminURL } from 'payload/shared'

import type { RouterInstance } from '../providers/Router/types.js'

type BackToDashboardProps = {
  adminRoute: string
  router: RouterInstance
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
