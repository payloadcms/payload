import type { PayloadRequest } from '../../types/index.js'
import type { TypeWithVersion } from '../../versions/types.js'
import type { SanitizedGlobalConfig } from '../config/types.js'

import { killTransaction } from '../../utilities/killTransaction.js'
import { unpublish } from '../../versions/unpublish.js'

export type Arguments = {
  globalConfig: SanitizedGlobalConfig
  req?: PayloadRequest
}

export const unpublishOperation = async <TData extends TypeWithVersion<TData>>(args: Arguments) => {
  const { globalConfig } = args

  const req = args.req!
  const { payload } = req

  try {
    const result = await unpublish({
      global: globalConfig,
      payload,
      req,
    })

    return result
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}
