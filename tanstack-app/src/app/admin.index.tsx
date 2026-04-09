import { createFileRoute } from '@tanstack/react-router'

import { AdminPageView } from '../components/AdminPageView/index.js'
import { loadDashboard } from '../functions/admin.functions.js'

export const Route = createFileRoute('/admin/')({
  loader: () => loadDashboard(),
  component: () => <AdminPageView {...Route.useLoaderData()} />,
})
