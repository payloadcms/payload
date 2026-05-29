import { createFileRoute, notFound, redirect } from '@tanstack/react-router'

import { loadAdminPageRSC } from '../../functions/adminPageRSC.functions.js'
import { getAdminMeta } from '@payloadcms/tanstack-start'

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
    const data = (await loadAdminPageRSC({
      data: {
        _splat: params._splat ?? '',
        search: Object.fromEntries(new URLSearchParams(location.searchStr)) as Record<
          string,
          string | string[]
        >,
      },
    })) as any
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
    meta: getAdminMeta({
      clientConfig: (loaderData as any)?.metadata?.clientConfig,
      collectionLabel: (loaderData as any)?.metadata?.collectionLabel,
      globalLabel: (loaderData as any)?.metadata?.globalLabel,
      viewType: (loaderData as any)?.metadata?.viewType,
    }),
  }),
  component: AdminPage,
})

function AdminPage() {
  const data = Route.useLoaderData() as any

  // RSC Flight payload — render directly, no client-side data reconstruction.
  return <>{data?.rscPayload}</>
}
