'use client'
import type { ServerFunctionClient } from 'payload'

import { RootProviders } from '@payloadcms/ui'
import { Outlet } from '@tanstack/react-router'
import React, { createContext, use } from 'react'

import type { RootLayoutData } from '../server.js'

import { TanStackRouterAdapter } from '../../router.js'

export const ServerFunctionContext = createContext<ServerFunctionClient | undefined>(undefined)

/** Binds the decoded layout model to the app's client-local dispatcher. */
export function PayloadRootProviders({ data }: { data: RootLayoutData }) {
  const serverFunction = use(ServerFunctionContext)

  if (!serverFunction) {
    throw new Error('PayloadRootProviders must be rendered within PayloadLayout')
  }

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
