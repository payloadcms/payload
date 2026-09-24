import { createServerFunctionHandler } from '@payloadcms/ui/utilities/handleServerFunctions'

import { createAdminContext } from './createAdminContext.server.js'
import { serializeForRsc } from './serializeForRsc.js'

export const handleServerFunctions = createServerFunctionHandler({
  createAdminContext,
  transformResult: serializeForRsc,
})
