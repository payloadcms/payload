import type { Access, AccessResult } from '../config/types'
import type { PayloadRequest } from '../exports/types'

import { Forbidden } from '../errors'

type OperationArgs = {
  data?: Record<string, unknown>
  disableErrors?: boolean
  id?: number | string
  req: PayloadRequest
}
const executeAccess = async (
  { id, data, disableErrors, req }: OperationArgs,
  access: Access,
): Promise<AccessResult> => {
  if (access) {
    const result = await access({
      id,
      data,
      payload: req.payload,
      user: req.user,
    })

    if (!result) {
      if (!disableErrors) throw new Forbidden(req.t)
    }

    return result
  }

  if (req.user) {
    return true
  }

  if (!disableErrors) throw new Forbidden(req.t)
  return false
}

export default executeAccess
