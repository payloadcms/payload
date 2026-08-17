import { createServerFunctionHandler } from '@payloadcms/ui/internal/server'

import { initReq } from './initReq.server.js'
import { serializeForRsc } from './serializeForRsc.js'

export const handleServerFunctions = createServerFunctionHandler({
  initReq: ({ configPromise, importMap }) => initReq({ configPromise, importMap }),
  transformResult: serializeForRsc,
})
