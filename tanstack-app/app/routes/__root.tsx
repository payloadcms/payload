import type { ServerFunctionClient } from 'payload'

import config from '@payload-config'
import { RootLayout } from '@payloadcms/tanstack-start'
import { dispatchServerFunction } from '@payloadcms/ui/utilities/handleServerFunctions'
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/start'
import React from 'react'

import { importMap } from '../importMap.js'
import { initReq } from '@payloadcms/tanstack-start/utilities/initReq'

// Server function: handles all Payload server function calls
const handleServerFn = createServerFn()
  .validator((data: unknown) => data as Parameters<ServerFunctionClient>[0])
  .handler(async ({ data: args }) => {
    const { notFound, redirect } = await import('@tanstack/react-router')
    const { cookies, locale, permissions, req } = await initReq({
      config,
      importMap,
      key: 'RootLayout',
    })
    return dispatchServerFunction({
      augmentedArgs: {
        ...args,
        cookies,
        importMap,
        locale,
        notFound: () => {
          throw notFound()
        },
        permissions,
        redirect: (url: string) => {
          throw redirect({ to: url })
        },
        req,
      },
      extraServerFunctions: (args as any)?.serverFunctions,
      name: (args as any)?.name,
    })
  })

// Thin wrapper matching Payload's ServerFunctionClient signature
const serverFunction: ServerFunctionClient = (args) => handleServerFn({ data: args })

export const rootRoute = createRootRoute({
  component: RootComponent,
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    ],
  }),
})

// Export the Route object required by TanStack Router file-based routing
export const Route = rootRoute

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
          <Outlet />
        </RootLayout>
        <Scripts />
      </body>
    </html>
  )
}
