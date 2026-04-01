import config from '@payload-config'
import { RootPage } from '@payloadcms/tanstack-start/views'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { initReq } from '@payloadcms/tanstack-start/utilities/initReq'
import React from 'react'

import { importMap } from '../importMap.js'

export const Route = createFileRoute('/admin/')({
  loader: async () => {
    const resolvedConfig = await config
    const {
      routes: { admin: adminRoute },
    } = resolvedConfig

    // Auth check in loader so TanStack Router handles redirects correctly
    const { permissions, req } = await initReq({ config, importMap, key: 'adminIndexLoader' })

    if (!permissions.canAccessAdmin) {
      const { isPublicAdminRoute } = await import('@payloadcms/ui/utilities/isPublicAdminRoute')
      if (!isPublicAdminRoute({ adminRoute, config: resolvedConfig, route: adminRoute })) {
        const { handleAuthRedirect } = await import('@payloadcms/ui/utilities/handleAuthRedirect')
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw redirect({
          to: handleAuthRedirect({ config: resolvedConfig, route: adminRoute, user: req.user }),
        })
      }
    }

    return null
  },
  component: AdminIndexPage,
})

function AdminIndexPage() {
  const search = Route.useSearch()

  return (
    <RootPage
      config={config}
      importMap={importMap}
      segments={[]}
      searchParams={search as Record<string, string | string[]>}
    />
  )
}
