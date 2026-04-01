import config from '@payload-config'
import { RootPage } from '@payloadcms/tanstack-start/views'
import { createFileRoute } from '@tanstack/react-router'
import React from 'react'

import { importMap } from '../importMap.js'

export const Route = createFileRoute('/admin/')({
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
