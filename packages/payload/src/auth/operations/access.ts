import { URL } from 'url'

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

async function accessOperation(args: Arguments): Promise<Permissions> {
  const {
    req,
    req: { payload, user },
  } = args

  adminInitTelemetry(req)
  const { searchParams } = new URL(req.url)

  try {
    const shouldCommit = await initTransaction(req)
    const results = getAccessResults({
      req: {
        data: req.data,
        payload,
        user,
      },
      searchParams,
    })
    if (shouldCommit) await commitTransaction(req)
    return results
  } catch (e: unknown) {
    await killTransaction(req)
    throw e
  }
}

export default accessOperation
