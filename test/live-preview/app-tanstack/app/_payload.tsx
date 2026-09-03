/// <reference types="vite/client" />

import { payloadLayoutRoute } from '@payloadcms/tanstack-start/client'
import { createFileRoute } from '@tanstack/react-router'

import { HydrationMarker } from '../components/HydrationMarker/index.js'
import { getLayoutDataFn, serverFunctionHandler } from './_payload/server.functions.js'
import styles from './payload.css?url'

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
