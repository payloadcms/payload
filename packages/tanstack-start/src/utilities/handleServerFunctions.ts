import { createServerFunctionHandler } from '@payloadcms/ui/utilities/handleServerFunctions'

import { getAdminContext } from './getAdminContext.server.js'
import { serializeForRsc } from './serializeForRsc.js'

export const handleServerFunctions = createServerFunctionHandler({
  getAdminContext,
  transformResult: serializeForRsc,
})
