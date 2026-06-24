import { createServerFunctionHandler } from '@payloadcms/ui/utilities/handleServerFunctions'

import { nextServerAdapter } from './server.js'

export const handleServerFunctions = createServerFunctionHandler({
  serverAdapter: nextServerAdapter,
})
