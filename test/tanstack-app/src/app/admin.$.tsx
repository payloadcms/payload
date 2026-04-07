import { getAdminPageData } from '@payloadcms/tanstack-start/views'
import { getAdminMeta } from '@payloadcms/tanstack-start/server'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import config from '@payload-config'

import { importMap } from '../importMap.js'

const loadAdminPage = createServerFn({ method: 'GET' })
  .inputValidator((data: { _splat: string; search: Record<string, string | string[]> }) => data)
  .handler(async ({ data }) => {
    const segments = data._splat ? data._splat.split('/').filter(Boolean) : []

    const result = await getAdminPageData({
      configPromise: config,
      importMap,
      params: { segments },
      searchParams: data.search ?? {},
    })

    if ('redirect' in result) {
      throw redirect({ to: result.redirect })
    }

    return result.data
  })

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
  const _data = Route.useLoaderData()

  return <div>Admin Page — view type: {_data?.viewProps?.viewType ?? 'loading'}</div>
}
