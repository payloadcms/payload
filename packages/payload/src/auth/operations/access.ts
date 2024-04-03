import type { PayloadRequest } from '../../types/index.js'
import type { Permissions } from '../types.js'

import { commitTransaction } from '../../utilities/commitTransaction.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { adminInit as adminInitTelemetry } from '../../utilities/telemetry/events/adminInit.js'
import { getAccessResults } from '../getAccessResults.js'

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
