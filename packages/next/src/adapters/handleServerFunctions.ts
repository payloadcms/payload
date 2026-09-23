import { createServerFunctionHandler } from '@payloadcms/ui/utilities/handleServerFunctions'

import { getAdminContext } from '../utilities/getAdminContext.js'

export const handleServerFunctions = createServerFunctionHandler({
  getAdminContext: ({ configPromise, importMap }) =>
    getAdminContext({ configPromise, importMap, key: 'RootLayout' }),
})
