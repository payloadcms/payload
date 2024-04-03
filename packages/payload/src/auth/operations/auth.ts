import type { PayloadRequest } from '../../types/index.js'
import type { Permissions, User } from '../types.js'

import { commitTransaction } from '../../utilities/commitTransaction.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { parseCookies } from '../cookies.js'
import { getAccessResults } from '../getAccessResults.js'
import { getAuthenticatedUser } from '../getAuthenticatedUser.js'

export type AuthArgs = {
  cookies?: Map<string, string>
  headers: Request['headers']
  req: Omit<PayloadRequest, 'user'>
}

export type AuthResult = {
  cookies: Map<string, string>
  permissions: Permissions
  user: User
}

export const auth = async (args: AuthArgs): Promise<AuthResult> => {
  const { headers } = args
  let { cookies } = args
  const req = args.req as PayloadRequest
  const { payload } = req

  if (!cookies) {
    cookies = parseCookies(headers)
  }

  try {
    const shouldCommit = await initTransaction(req)

    const user = await getAuthenticatedUser({
      cookies,
      headers,
      payload,
    })

    req.user = user

    const permissions = await getAccessResults({
      req,
    })

    if (shouldCommit) await commitTransaction(req)

    return {
      cookies,
      permissions,
      user,
    }
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}
