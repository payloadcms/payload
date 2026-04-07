import { getAdminPageData } from '@payloadcms/tanstack-start/views'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import config from '@payload-config'

import { importMap } from '../importMap.js'

const loadDashboard = createServerFn({ method: 'GET' }).handler(async () => {
  const result = await getAdminPageData({
    configPromise: config,
    importMap,
    params: { segments: [] },
    searchParams: {},
  })

  if ('redirect' in result) {
    throw redirect({ to: result.redirect })
  }

  return result.data
})

export const Route = createFileRoute('/admin/')({
  loader: () => loadDashboard(),
  component: AdminDashboard,
})

function AdminDashboard() {
  const _data = Route.useLoaderData()

  return <div>Dashboard — view type: {_data?.viewProps?.viewType ?? 'loading'}</div>
}
