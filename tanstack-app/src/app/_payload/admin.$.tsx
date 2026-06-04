import { createFileRoute, notFound, redirect, useLocation } from '@tanstack/react-router'
import { Fragment } from 'react'

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
  const pathname = useLocation({ select: (location) => location.pathname })

  // RSC Flight payload — render directly, no client-side data reconstruction.
  //
  // Key the subtree by pathname so navigating to a different admin page (e.g.
  // the create → edit redirect after a successful save) remounts the view,
  // mirroring Next.js route-segment semantics. Without this the `$` splat route
  // reconciles in place and mount-only effects never re-run — most visibly the
  // "successfully created" toast that the Edit view replays from sessionStorage
  // on mount. Same-pathname navigations (e.g. list-view filtering via search
  // params) keep the same key and reconcile in place.
  return <Fragment key={pathname}>{data?.rscPayload}</Fragment>
}
