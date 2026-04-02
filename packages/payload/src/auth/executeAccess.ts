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
export const executeAccess = async (
  { id, data, disableErrors, isReadingStaticFile = false, req }: OperationArgs,
  access: Access,
): Promise<AccessResult> => {
  if (access) {
    const resolvedConstraint = await access({
      id,
      data,
      isReadingStaticFile,
      req,
    })

    if (!resolvedConstraint) {
      if (!disableErrors) {
        throw new Forbidden(req.t)
      }
    }

    return resolvedConstraint
  }

  if (req.user) {
    return true
  }

  if (!disableErrors) {
    throw new Forbidden(req.t)
  }
  return false
}
