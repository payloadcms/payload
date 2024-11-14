import type { Access, AccessResult } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { Forbidden } from '../errors/index.js'

type OperationArgs = {
  data?: any
  disableErrors?: boolean
  id?: number | string
  isReadingStaticFile?: boolean
  req: PayloadRequest
}
const executeAccess = async (
  { id, data, disableErrors, isReadingStaticFile = false, req }: OperationArgs,
  access: Access,
): Promise<AccessResult> => {
  if (access) {
    const result = await access({
      id,
      data,
      isReadingStaticFile,
      req,
    })

    if (!result) {
      if (!disableErrors) {
        throw new Forbidden(req.t)
      }
    }

    return result
  }

  if (req.user) {
    return true
  }

  if (!disableErrors) {
    throw new Forbidden(req.t)
  }
  return false
}

export default executeAccess
