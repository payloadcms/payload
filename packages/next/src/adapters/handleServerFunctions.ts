import { createServerFunctionHandler } from '@payloadcms/ui/utilities/handleServerFunctions'

import { createAdminContext } from '../utilities/createAdminContext.js'

export const handleServerFunctions = createServerFunctionHandler({
  createAdminContext: ({ configPromise, importMap }) =>
    createAdminContext({ configPromise, importMap, key: 'RootLayout' }),
})
