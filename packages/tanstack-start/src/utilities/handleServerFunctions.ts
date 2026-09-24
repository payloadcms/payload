import { createServerFunctionHandler } from '@payloadcms/ui/utilities/handleServerFunctions'

import { initAdminContext } from './initAdminContext.server.js'
import { serializeForRsc } from './serializeForRsc.js'

export const handleServerFunctions = createServerFunctionHandler({
  initAdminContext,
  transformResult: serializeForRsc,
})
