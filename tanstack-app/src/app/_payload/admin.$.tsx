import { createFileRoute, notFound, redirect } from '@tanstack/react-router'

import { AdminPageView } from '../../components/AdminPageView/index.js'
import { loadAdminPage } from '../../functions/admin.functions.js'

export const Route = createFileRoute('/_payload/admin/$')({
  // Pass URL search params straight through so they appear in `loaderDeps`.
  // Without this, TanStack Router treats `search` as `{}` and the loader is
  // never re-run when query params like `?locale=es` change, which breaks
  // locale-driven access control, form refetches, etc.
  validateSearch: (search: Record<string, unknown>) => search,
  loaderDeps: ({ search }) => ({
    searchKey: JSON.stringify(search),
  }),
  loader: async ({ params, location }) => {
    const data = await loadAdminPage({
      data: {
        _splat: params._splat ?? '',
        search: Object.fromEntries(new URLSearchParams(location.searchStr)) as Record<
          string,
          string | string[]
        >,
      },
    })
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
