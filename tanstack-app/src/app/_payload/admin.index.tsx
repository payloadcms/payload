import { createFileRoute, notFound, redirect } from '@tanstack/react-router'

import { AdminPageView } from '../../components/AdminPageView/index.js'
import { loadDashboard } from '../../functions/admin.functions.js'

export const Route = createFileRoute('/_payload/admin/')({
  // Mirror admin.$.tsx: surface query params in `loaderDeps` so changes like
  // `?locale=es` re-run the loader (server-side handler upserts the user's
  // locale preference and resolves access for the current locale).
  validateSearch: (search: Record<string, unknown>) => search,
  loaderDeps: ({ search }) => ({
    searchKey: JSON.stringify(search),
  }),
  loader: async ({ location }) => {
    const data = await loadDashboard({
      data: {
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
  component: () => <AdminPageView {...Route.useLoaderData()} />,
})
