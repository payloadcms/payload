import type { ServerFunctionClient } from 'payload'

import config from '@payload-config'
import { RootLayout, handleServerFunctions } from '@payloadcms/tanstack-start'
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import React from 'react'

const handleServerFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => data as Parameters<ServerFunctionClient>[0])
  .handler(async ({ data: args }) => {
    const { importMap } = await import('../importMap.js')

    return handleServerFunctions({
      args: (args as any)?.args,
      config,
      importMap,
      name: (args as any)?.name,
      serverFunctions: (args as any)?.serverFunctions,
    })
  })

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

export const Route = rootRoute

async function RootComponent() {
  const { importMap } = await import('../importMap.js')

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
