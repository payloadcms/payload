import { createFileRoute } from '@tanstack/react-router'

import { AdminPageView } from '../../components/AdminPageView/index.js'
import { loadAdminPage } from '../../functions/admin.functions.js'

export const Route = createFileRoute('/_payload/admin/$')({
  loaderDeps: ({ search }) => ({
    searchKey: JSON.stringify(search),
  }),
  loader: ({ params, location }) =>
    loadAdminPage({
      data: {
        _splat: params._splat ?? '',
        search: Object.fromEntries(new URLSearchParams(location.searchStr)) as Record<
          string,
          string | string[]
        >,
      },
    }),
  head: ({ loaderData }) => ({
    meta: buildAdminMeta({
      titleSuffix: loaderData?.viewProps?.clientConfig?.admin?.meta?.titleSuffix,
      viewType: loaderData?.viewProps?.viewType,
    }),
  }),
  component: AdminPage,
})

function buildAdminMeta({ titleSuffix, viewType }: { titleSuffix?: string; viewType?: string }) {
  const siteName = titleSuffix ?? 'Payload Admin'

  let pageTitle = siteName

  if (viewType === 'dashboard') {
    pageTitle = `Dashboard | ${siteName}`
  } else if (viewType === 'document' || viewType === 'list') {
    pageTitle = siteName
  }

  return [
    { charSet: 'utf-8' as const },
    { content: 'width=device-width, initial-scale=1', name: 'viewport' },
    { title: pageTitle },
  ]
}

function AdminPage() {
  const data = Route.useLoaderData()

  return <AdminPageView {...data} />
}
