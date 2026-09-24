import { createServerFunctionHandler } from '@payloadcms/ui/utilities/handleServerFunctions'

import { initReq } from '../utilities/initReq.js'

export const handleServerFunctions = createServerFunctionHandler({
  initReq: ({ configPromise, importMap }) =>
    initReq({ configPromise, importMap, key: 'RootLayout' }),
})
