import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime.js'

import { formatAdminURL } from 'payload/shared'

type BackToDashboardProps = {
  adminRoute: string
  router: AppRouterInstance
  serverURL?: string
}

export const handleBackToDashboard = ({ adminRoute, router, serverURL }: BackToDashboardProps) => {
  const redirectRoute = formatAdminURL({
    adminRoute,
    path: '/',
  })
  router.push(redirectRoute)
}
