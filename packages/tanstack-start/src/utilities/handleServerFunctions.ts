import { createServerFunctionHandler } from '@payloadcms/ui/utilities/handleServerFunctions'
import { getRequest } from '@tanstack/react-start/server'
import { initReq } from 'payload'

import { serializeForRsc } from './serializeForRsc.js'
import { tanstackServerAdapter } from './serverAdapter.server.js'

export const handleServerFunctions = createServerFunctionHandler({
  initReq: ({ configPromise, importMap }) =>
    initReq({
      configPromise,
      importMap,
      requestURL: getRequest().url,
      serverAdapter: tanstackServerAdapter,
    }),
  transformResult: serializeForRsc,
})
