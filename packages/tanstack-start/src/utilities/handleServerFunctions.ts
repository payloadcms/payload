import { createServerFunctionHandler } from '@payloadcms/ui/utilities/handleServerFunctions'

import { initReq } from './initReq.server.js'
import { serializeForRsc } from './serializeForRsc.js'

export const handleServerFunctions = createServerFunctionHandler({
  initReq: ({ configPromise, importMap }) => initReq({ configPromise, importMap }),
  transformResult: serializeForRsc,
})
