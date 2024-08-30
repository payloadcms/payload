import type { TypedUser } from '../../index.js'
import type { PayloadRequest } from '../../types/index.js'
import type { Permissions } from '../types.js'

import { commitTransaction } from '../../utilities/commitTransaction.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { executeAuthStrategies } from '../executeAuthStrategies.js'
import { getAccessResults } from '../getAccessResults.js'

export type AuthArgs = {
  headers: Request['headers']
  req?: Omit<PayloadRequest, 'user'>
}

export type AuthResult = {
  permissions: Permissions
  responseHeaders?: Headers
  user: null | TypedUser
}

export const auth = async (args: Required<AuthArgs>): Promise<AuthResult> => {
  const { headers } = args
  const req = args.req as PayloadRequest
  const { payload } = req

  try {
    const shouldCommit = await initTransaction(req)

    const { responseHeaders, user } = await executeAuthStrategies({
      headers,
      payload,
    })

    req.user = user
    req.responseHeaders = responseHeaders

    const permissions = await getAccessResults({
      req,
    })

    if (shouldCommit) {
      await commitTransaction(req)
    }

    return {
      permissions,
      responseHeaders,
      user,
    }
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}
