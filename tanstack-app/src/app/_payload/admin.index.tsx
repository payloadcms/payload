import { createFileRoute, notFound, redirect } from '@tanstack/react-router'

import { AdminPageView } from '../../components/AdminPageView/index.js'
import { loadDashboard } from '../../functions/admin.functions.js'

export const Route = createFileRoute('/_payload/admin/')({
  loader: async () => {
    const data = await loadDashboard()
    if (data?._redirect) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- TanStack Router requires throwing redirect objects
      throw redirect({ to: data._redirect })
    }
    if (data?._notFound) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- TanStack Router requires throwing notFound objects
      throw notFound()
    }
    return data
  },
  component: () => <AdminPageView {...Route.useLoaderData()} />,
})
