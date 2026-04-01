import config from '@payload-config'
import { RootPage } from '@payloadcms/tanstack-start/views'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { initReq } from '@payloadcms/tanstack-start/utilities/initReq'
import React from 'react'

import { importMap } from '../importMap.js'

export const Route = createFileRoute('/admin/$')({
  loader: async ({ params }) => {
    const segments = params._splat?.split('/').filter(Boolean) ?? []
    const resolvedConfig = await config
    const {
      routes: { admin: adminRoute },
    } = resolvedConfig

    // Handle known redirect patterns in the loader (TanStack redirect works correctly in loaders)
    if (segments.length === 1 && (segments[0] === 'collections' || segments[0] === 'globals')) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({ to: adminRoute })
    }

    // Auth check in loader so TanStack Router handles redirects correctly
    const { isPublicAdminRoute } = await import('@payloadcms/ui/utilities/isPublicAdminRoute')
    const { isCustomAdminView } = await import('@payloadcms/ui/utilities/isCustomAdminView')
    const currentRoute = `${adminRoute}/${segments.join('/')}`

    if (
      !isPublicAdminRoute({ adminRoute, config: resolvedConfig, route: currentRoute }) &&
      !isCustomAdminView({ adminRoute, config: resolvedConfig, route: currentRoute })
    ) {
      const { permissions, req } = await initReq({ config, importMap, key: 'adminLoader' })
      if (!permissions.canAccessAdmin) {
        const { handleAuthRedirect } = await import('@payloadcms/ui/utilities/handleAuthRedirect')
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw redirect({
          to: handleAuthRedirect({ config: resolvedConfig, route: currentRoute, user: req.user }),
        })
      }
    }

    return { segments }
  },
  component: AdminPage,
})

function AdminPage() {
  const { segments } = Route.useLoaderData()
  const search = Route.useSearch()

  return (
    <RootPage
      config={config}
      importMap={importMap}
      segments={segments}
      searchParams={search as Record<string, string | string[]>}
    />
  )
}
