import { createServerFunctionHandler } from '@payloadcms/ui/utilities/handleServerFunctions'

import { RenderRSCComponent } from '../rsc/renderPayloadRSC.js'
import { initReq } from './initReq.server.js'
import { serializeForRsc } from './serializeForRsc.js'

export const handleServerFunctions = createServerFunctionHandler({
  augmentArgs: () => ({ mode: 'rsc', renderComponent: RenderRSCComponent }),
  initReq: ({ configPromise, importMap }) => initReq({ configPromise, importMap }),
  transformResult: serializeForRsc,
})
