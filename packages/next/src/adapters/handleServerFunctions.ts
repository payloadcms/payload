import { createServerFunctionHandler, initReq } from '@payloadcms/ui/internal/server'

import { nextServerAdapter } from './server.js'

export const handleServerFunctions = createServerFunctionHandler({
  initReq: ({ configPromise, importMap }) =>
    initReq({ configPromise, importMap, key: 'RootLayout', serverAdapter: nextServerAdapter }),
})
