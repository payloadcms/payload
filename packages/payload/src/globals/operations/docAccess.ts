import type { GlobalPermission } from '../../auth/index.js'
import type { AllOperations, PayloadRequest } from '../../types/index.js'
import type { SanitizedGlobalConfig } from '../config/types.js'

import { commitTransaction } from '../../utilities/commitTransaction.js'
import { getEntityPolicies } from '../../utilities/getEntityPolicies.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'

type Arguments = {
  globalConfig: SanitizedGlobalConfig
  req: PayloadRequest
}

export const docAccessOperation = async (args: Arguments): Promise<GlobalPermission> => {
  const { globalConfig, req } = args

  const globalOperations: AllOperations[] = ['read', 'update']

  if (globalConfig.versions) {
    globalOperations.push('readVersions')
  }

  try {
    const shouldCommit = await initTransaction(req)
    const result = await getEntityPolicies({
      type: 'global',
      entity: globalConfig,
      operations: globalOperations,
      req,
    })
    if (shouldCommit) {
      await commitTransaction(req)
    }
    return result
  } catch (e: unknown) {
    await killTransaction(req)
    throw e
  }
}
