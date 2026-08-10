import { payloadLayoutRoute } from '@payloadcms/tanstack-start/client'
import { createFileRoute } from '@tanstack/react-router'
import '@payloadcms/ui/css/app.css'
// Custom admin styles for this test app — mirrors the Next test app's
// `(payload)/custom.css` so the shared "custom CSS" e2e passes on both adapters.
import './custom.css'

import { getLayoutDataFn, serverFunctionHandler } from './_payload/server.functions.js'

const { component: PayloadProviders, loader } = payloadLayoutRoute({
  load: getLayoutDataFn,
  serverFunction: serverFunctionHandler,
})

export const Route = createFileRoute('/_payload')({
  component: PayloadProviders,
  loader,
})
