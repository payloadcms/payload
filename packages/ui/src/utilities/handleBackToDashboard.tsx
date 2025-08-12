import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime.js'

import { formatAdminURL } from 'payload/shared'

type BackToDashboardProps = {
  adminRoute: string
  router: AppRouterInstance
}

export const handleBackToDashboard = ({ adminRoute, router }: BackToDashboardProps) => {
  const redirectRoute = formatAdminURL({
    adminRoute,
    path: '/',
  })
  router.push(redirectRoute)
}
