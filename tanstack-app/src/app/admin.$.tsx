import { AdminView, getAdminMeta } from '@payloadcms/tanstack-start/views'
import { createFileRoute } from '@tanstack/react-router'

import { loadAdminPage } from '../functions/admin.functions'
import { importMap } from '../importMap.js'

export const Route = createFileRoute('/admin/$')({
  loader: ({ params, location }) =>
    loadAdminPage({
      data: {
        _splat: params._splat ?? '',
        search: Object.fromEntries(new URLSearchParams(location.search)),
      },
    }),
  head: ({ loaderData }) => ({
    meta: getAdminMeta({
      clientConfig: loaderData?.viewProps?.clientConfig,
      viewType: loaderData?.viewProps?.viewType,
    }),
  }),
  component: AdminPage,
})

function AdminPage() {
  const data = Route.useLoaderData()

  return <AdminView {...data} importMap={importMap} />
}
