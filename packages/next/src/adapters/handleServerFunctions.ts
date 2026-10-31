import { createServerFunctionHandler } from '@payloadcms/ui/utilities/handleServerFunctions'

import { initAdminContext } from '../utilities/initAdminContext.js'

export const handleServerFunctions = createServerFunctionHandler({
  initAdminContext: ({ configPromise, importMap, requestURL }) =>
    initAdminContext({ configPromise, importMap, key: 'RootLayout', requestURL }),
})
