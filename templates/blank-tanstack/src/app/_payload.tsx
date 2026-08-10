import { payloadLayoutRoute } from '@payloadcms/tanstack-start/client'
import { createFileRoute } from '@tanstack/react-router'
import '../payload-foundation.css'
import '@payloadcms/ui/css/app.css'

import { getLayoutDataFn, serverFunctionHandler } from './_payload/server.functions.js'

export const Route = createFileRoute('/_payload')(
  payloadLayoutRoute({
    load: getLayoutDataFn,
    serverFunction: serverFunctionHandler,
  }),
)
