import { createServerFunctionHandler } from '@payloadcms/ui/utilities/handleServerFunctions'

import { initAdminContext } from '../utilities/initAdminContext.server.js'
import { serializeForRsc } from '../utilities/serializeForRsc.js'

export const handleServerFunctions = createServerFunctionHandler({
  initAdminContext,
  transformResult: serializeForRsc,
})
