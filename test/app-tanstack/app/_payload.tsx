import { payloadLayoutRoute } from '@payloadcms/tanstack-start/client'
import { createFileRoute } from '@tanstack/react-router'
import '@payloadcms/ui/scss/app.scss'
// Custom admin styles for this test app — mirrors the Next test app's
// `(payload)/custom.scss` so the shared "custom CSS" e2e passes on both adapters.
import './custom.scss'

import { HydrationMarker } from '../components/HydrationMarker/index.js'
import { getLayoutDataFn, serverFunctionHandler } from './_payload/server.functions.js'

const { component: PayloadProviders, loader } = payloadLayoutRoute({
  load: getLayoutDataFn,
  serverFunction: serverFunctionHandler,
})

export const Route = createFileRoute('/_payload')({
  component: PayloadLayout,
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
