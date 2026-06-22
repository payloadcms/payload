import { createFileRoute, notFound, redirect } from '@tanstack/react-router'

import { getAdminMeta } from '@payloadcms/tanstack-start'
import { loadAdminPageRSC } from '~/functions/adminPageRSC.functions.js'

export const Route = createFileRoute('/_payload/admin/')({
  // Mirror admin.$.tsx: surface query params in `loaderDeps` so changes like
  // `?locale=es` re-run the loader (server-side handler upserts the user's
  // locale preference and resolves access for the current locale).
  validateSearch: (search: Record<string, unknown>) => search,
  loaderDeps: ({ search }) => ({
    searchKey: JSON.stringify(search),
  }),
  loader: async ({ location }) => {
    const data = (await loadAdminPageRSC({
      data: {
        _splat: '',
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
  head: ({ loaderData }) => getAdminMeta((loaderData as any)?.metadata),
  component: AdminPage,
})

function AdminPage() {
  const data = Route.useLoaderData() as any

  return <>{data?.rscPayload}</>
}
