import type { AuthenticatedUser, SanitizedPermissions } from '../../index.js'
import type { PayloadRequest } from '../../types/index.js'

import { executeAuthStrategies } from '../executeAuthStrategies.js'
import { getAccessResults } from '../getAccessResults.js'

export type AuthArgs = {
  /**
   * Specify if it's possible for auth strategies to set headers within this operation.
   */
  canSetHeaders?: boolean
  headers: Request['headers']
  req?: Omit<PayloadRequest, 'user'>
}

export type AuthResult = {
  permissions: SanitizedPermissions
  responseHeaders?: Headers
  user: AuthenticatedUser | null
}

export const auth = async (args: Required<AuthArgs>): Promise<AuthResult> => {
  const { canSetHeaders, headers } = args
  const req = args.req as PayloadRequest
  const { payload } = req

  const { responseHeaders, user } = await executeAuthStrategies({
    canSetHeaders,
    headers,
    payload,
  })

  req.user = user
  req.responseHeaders = responseHeaders

  const permissions = await getAccessResults({
    req,
  })

  return {
    permissions,
    responseHeaders,
    user,
  }
}
