import { NotFoundClient } from '@payloadcms/ui'
import { createFileRoute, notFound, redirect } from '@tanstack/react-router'
import { Fragment, type ReactNode } from 'react'

import { loadAdminPageRSC } from './adminPageRSC.functions.js'
import { getAdminMeta } from '@payloadcms/tanstack-start'

export const Route = createFileRoute('/_payload/admin/$')({
  // Render Payload's NotFound view for unknown admin routes / access-denied.
  // Throwing `notFound()` in the loader sets the SSR document status to 404 (the
  // only mechanism — see `loadAdminPageRSC.renderNotFound`). The loader ships the
  // server-rendered NotFound page (full admin layout incl. nav, matching Next) as
  // the error's `data.rscPayload`; render it here. Falls back to the bare client
  // view if no payload was provided.
  notFoundComponent: AdminNotFound,
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
      throw notFound({
        data: { routeKey: data.routeKey, rscPayload: data.rscPayload },
      })
    }
    return data
  },
  head: ({ loaderData }) => getAdminMeta((loaderData as any)?.metadata),
  component: AdminPage,
})

// Renders the server-built NotFound page passed through the `notFound()` error's
// `data.rscPayload` (full admin layout incl. nav, matching Next). The whole
// `NotFoundError` object is spread onto props, so `data` lives at `props.data`.
function AdminNotFound(props: { data?: { routeKey?: string; rscPayload?: ReactNode } }) {
  const rscPayload = props?.data?.rscPayload

  if (!rscPayload) {
    return <NotFoundClient />
  }

  return <Fragment key={props?.data?.routeKey}>{rscPayload}</Fragment>
}

function AdminPage() {
  const data = Route.useLoaderData() as any

  // RSC Flight payload — render directly, no client-side data reconstruction.
  //
  // Key the subtree by `routeKey` (the splat, derived server-side from the same
  // loader result as `rscPayload`) so navigating to a different admin page
  // (e.g. the create → edit redirect after a save, or duplicate) remounts the
  // view, mirroring Next.js route-segment semantics. Mount-only effects re-run
  // and client providers (DocumentInfo, etc.) re-initialize from the new
  // payload's props.
  //
  // We deliberately key by the loader-derived `routeKey` rather than
  // `location.pathname`: during a navigation transition the pathname updates
  // before `useLoaderData()`, so a pathname key would remount with the
  // *previous* payload and then reconcile the fresh payload in place, leaving
  // providers holding stale `useState` from the prior document (e.g. a
  // duplicated draft showing the source's "Published" status). `routeKey`
  // changes in lockstep with `rscPayload`. Search params are excluded so
  // search-only changes (list-view filtering) reconcile in place.
  return <Fragment key={data?.routeKey}>{data?.rscPayload}</Fragment>
}
