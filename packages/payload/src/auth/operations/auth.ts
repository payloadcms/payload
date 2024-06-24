import type { GeneratedTypes } from '../../index.js'
import type { PayloadRequestWithData } from '../../types/index.js'
import type { Permissions } from '../types.js'

import { commitTransaction } from '../../utilities/commitTransaction.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { executeAuthStrategies } from '../executeAuthStrategies.js'
import { getAccessResults } from '../getAccessResults.js'

export type AuthArgs = {
  headers: Request['headers']
  req?: Omit<PayloadRequestWithData, 'user'>
}

export type AuthResult = {
  permissions: Permissions
  user: GeneratedTypes['user'] | null
}

export const auth = async (args: Required<AuthArgs>): Promise<AuthResult> => {
  const { headers } = args
  const req = args.req as PayloadRequestWithData
  const { payload } = req

  try {
    const shouldCommit = await initTransaction(req)

    const user = await executeAuthStrategies({
      headers,
      payload,
    })

    req.user = user

    const permissions = await getAccessResults({
      req,
    })

    if (shouldCommit) await commitTransaction(req)

    return {
      permissions,
      user,
    }
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}
