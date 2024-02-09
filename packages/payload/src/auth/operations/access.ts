import type { PayloadRequest } from '../../types'
import type { Permissions } from '../types'

import { commitTransaction } from '../../utilities/commitTransaction'
import { initTransaction } from '../../utilities/initTransaction'
import { killTransaction } from '../../utilities/killTransaction'
import { adminInit as adminInitTelemetry } from '../../utilities/telemetry/events/adminInit'
import { getAccessResults } from '../getAccessResults'

type Arguments = {
  req: PayloadRequest
}

export const accessOperation = async (args: Arguments): Promise<Permissions> => {
  const { req } = args

  adminInitTelemetry(req)

  try {
    const shouldCommit = await initTransaction(req)
    const results = getAccessResults({ req })
    if (shouldCommit) await commitTransaction(req)
    return results
  } catch (e: unknown) {
    await killTransaction(req)
    throw e
  }
}
