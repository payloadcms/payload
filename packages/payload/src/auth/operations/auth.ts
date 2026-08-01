import { z } from 'zod'

import type { AuthenticatedUser, Payload, SanitizedPermissions } from '../../index.js'
import type { LocalAPIOptions } from '../../operations/localAPI.js'
import type { PayloadRequest } from '../../types/index.js'

import { defineLocalAPI, defineOperation } from '../../operations/defineOperation.js'
import { killTransaction } from '../../utilities/killTransaction.js'
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

const authenticateRequest = async (args: Required<AuthArgs>): Promise<AuthResult> => {
  const { canSetHeaders, headers } = args
  const req = args.req as PayloadRequest
  const { payload } = req

  try {
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
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}

type AuthLocalMethod = (options: LocalAPIOptions<AuthArgs>) => Promise<AuthResult>

const authSchema = z.looseObject({
  headers: z.unknown().describe('Authentication request headers'),
})

export const authLocalAPI = defineLocalAPI<AuthLocalMethod>()({ name: 'auth' })

export const auth = defineOperation({
  action: 'auth',
  expose: { local: authLocalAPI, mcp: { name: 'auth' } },
  handler: async (_payload: Payload, options: AuthArgs) => {
    const req = options.req as PayloadRequest

    return authenticateRequest({
      canSetHeaders: options.canSetHeaders ?? true,
      headers: options.headers,
      req,
    })
  },
  input: authSchema,
  target: 'auth',
})
