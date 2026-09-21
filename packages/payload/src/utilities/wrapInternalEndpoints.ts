import type { Endpoint } from '../config/types.js'

import { unlinkClientUploadTempFile } from '../uploads/unlinkClientUploadTempFile.js'
import { addDataAndFileToRequest } from './addDataAndFileToRequest.js'
import { addLocalesToRequestFromData } from './addLocalesToRequest.js'

export const wrapInternalEndpoints = (endpoints: Endpoint[]): Endpoint[] => {
  return endpoints.map((endpoint) => {
    const handler = endpoint.handler

    if (['patch', 'post'].includes(endpoint.method)) {
      endpoint.handler = async (req) => {
        try {
          await addDataAndFileToRequest(req)
          addLocalesToRequestFromData(req)
          return await handler(req)
        } finally {
          await unlinkClientUploadTempFile({ req })
        }
      }
    }

    return endpoint
  })
}
