import config from '@payload-config'
import { TanStackAdminPage } from '@payloadcms/tanstack-start/views'
import { getPageState } from '@payloadcms/tanstack-start/views/getPageState'
import { createFileRoute, redirect } from '@tanstack/react-router'
import React from 'react'

import { searchParamsToRecord } from '../utilities/searchParams.js'

export const Route = createFileRoute('/admin/')({
  loader: async ({ location }) => {
    const { importMap } = await import('../importMap.js')

    try {
      return await getPageState({
        config,
        importMap,
        searchParams: searchParamsToRecord(location.search),
        segments: [],
      })
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('REDIRECT:')) {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw redirect({ to: error.message.replace('REDIRECT:', '') })
      }

      if (error instanceof Error && error.message === 'not-found') {
        throw error
      }

      throw error
    }
  },
  component: AdminIndexPage,
})

function AdminIndexPage() {
  const pageState = Route.useLoaderData()

  return <TanStackAdminPage pageState={pageState} />
}
