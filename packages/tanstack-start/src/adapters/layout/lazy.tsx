'use client'
import type { ServerFunctionClient } from 'payload'

import { RootProviders } from '@payloadcms/ui'
import { Outlet, useLoaderData } from '@tanstack/react-router'
import React from 'react'

import { TanStackRouterAdapter } from '../router.js'

/**
 * The admin layout route's component. Maps the layout loader data onto `RootProviders` and
 * renders the admin chrome (progress bar, custom-provider tree or router `<Outlet />`, portal
 * mount). `payloadLayoutRoute` loads it lazily, so front-end routes never download the admin UI.
 */
export function PayloadLayout({ serverFunction }: { serverFunction: ServerFunctionClient }) {
  const data = useLoaderData({ strict: false })

  return (
    <RootProviders
      data={data}
      RouterAdapter={TanStackRouterAdapter}
      serverFunction={serverFunction}
    >
      {data.providers ?? <Outlet />}
    </RootProviders>
  )
}
