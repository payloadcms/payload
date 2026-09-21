/// <reference types="vite/client" />

import { payloadLayoutRoute } from '@payloadcms/tanstack-start/client'
import { createFileRoute } from '@tanstack/react-router'

import { HydrationMarker } from '../components/HydrationMarker/index.js'
import { getLayoutDataFn, serverFunctionHandler } from './_payload/server.functions.js'
import styles from './payload.css?url'

// Registers the active suite's `createServerFn` definitions, if it has any. Resolved by
// `vite.tanstack.config.ts` to `test/<suite>/tanstackServerFunctions.ts`, or to a stub.
//
// A server function is only added to an environment's resolver manifest when that
// environment transforms the module defining it, and only route modules are reached early
// enough for the RSC manifest — the one serving the server-function RPC — to include them.
// A suite's functions are otherwise imported solely by its client components, which the RSC
// build replaces with client references, so calling one in a production build fails with
// "Server function info not found".
import '@payload-suite-server-functions'

const { component: PayloadProviders, loader } = payloadLayoutRoute({
  load: getLayoutDataFn,
  serverFunction: serverFunctionHandler,
})

export const Route = createFileRoute('/_payload')({
  component: PayloadLayout,
  head: () => ({
    links: [
      { rel: 'stylesheet', href: styles },
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Roboto+Mono:wght@100..700&display=swap',
      },
    ],
  }),
  loader,
})

// `withPayloadRoot` swaps `__root`'s shell (and its `<HydrationMarker />`) for the
// Payload admin document on `/admin` routes, so the marker must be re-mounted here
// for the Playwright hydration-wait wrapper to fire on admin pages.
function PayloadLayout() {
  return (
    <>
      <PayloadProviders />
      <HydrationMarker />
    </>
  )
}
