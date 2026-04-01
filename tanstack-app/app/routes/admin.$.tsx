import config from '@payload-config'
import { RootPage } from '@payloadcms/tanstack-start/views'
import { createFileRoute } from '@tanstack/react-router'
import React from 'react'

import { importMap } from '../importMap.js'

export const Route = createFileRoute('/admin/$')({
  component: AdminPage,
})

function AdminPage() {
  const params = Route.useParams()
  const search = Route.useSearch()
  const segments = params._splat?.split('/').filter(Boolean) ?? []

  return (
    <RootPage
      config={config}
      importMap={importMap}
      segments={segments}
      searchParams={search as Record<string, string | string[]>}
    />
  )
}
