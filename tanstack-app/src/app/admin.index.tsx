import { AdminView } from '@payloadcms/tanstack-start/views'
import { createFileRoute } from '@tanstack/react-router'

import { loadDashboard } from '../functions/admin.functions'

export const Route = createFileRoute('/admin/')({
  loader: () => loadDashboard(),
  component: () => <AdminView {...Route.useLoaderData()} />,
})
