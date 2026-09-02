import type { AuthenticatedUser, SanitizedPermissions, TypedLocale } from '../../index.js'
import type { PayloadRequest } from '../../types/index.js'

import { executeAuthStrategies } from '../executeAuthStrategies.js'
import { getAccessResults } from '../getAccessResults.js'

export type AuthArgs = {
  /**
   * Specify if it's possible for auth strategies to set headers within this operation.
   */
  canSetHeaders?: boolean
  fallbackLocale?: false | TypedLocale
  headers: Request['headers']
  locale?: 'all' | TypedLocale
  req?: Omit<PayloadRequest, 'user'>
}

export type AuthResult = {
  permissions: SanitizedPermissions
  responseHeaders?: Headers
  user: AuthenticatedUser | null
}

export const auth = async (args: {
  canSetHeaders?: boolean
  headers: Request['headers']
  req: PayloadRequest
}): Promise<AuthResult> => {
  const { canSetHeaders, headers } = args
  const req = args.req
  const { payload } = req

  const { responseHeaders, user } = await executeAuthStrategies({
    canSetHeaders,
    fallbackLocale: req.fallbackLocale,
    headers,
    locale: req.locale,
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
