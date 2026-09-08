import { createServerFunctionHandler } from '@payloadcms/ui/utilities/handleServerFunctions'
import { initReq } from '@payloadcms/ui/utilities/initReq'

import { nextServerAdapter } from './server.js'

export const handleServerFunctions = createServerFunctionHandler({
  initReq: ({ configPromise, importMap }) =>
    initReq({ configPromise, importMap, key: 'RootLayout', serverAdapter: nextServerAdapter }),
})
