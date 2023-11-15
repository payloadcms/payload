import type { GlobalPermission } from '../../auth'
import type { PayloadRequest } from '../../express/types'
import type { AllOperations } from '../../types'
import type { SanitizedGlobalConfig } from '../config/types'

import { commitTransaction } from '../../utilities/commitTransaction'
import { getEntityPolicies } from '../../utilities/getEntityPolicies'
import { initTransaction } from '../../utilities/initTransaction'
import { killTransaction } from '../../utilities/killTransaction'

type Arguments = {
  globalConfig: SanitizedGlobalConfig
  req: PayloadRequest
}

export async function docAccess(args: Arguments): Promise<GlobalPermission> {
  const { globalConfig, req } = args

  const globalOperations: AllOperations[] = ['read', 'update']

  if (globalConfig.versions) {
    globalOperations.push('readVersions')
  }

  try {
    const shouldCommit = await initTransaction(req)
    const result = await getEntityPolicies({
      entity: globalConfig,
      operations: globalOperations,
      req,
      type: 'global',
    })
    if (shouldCommit) await commitTransaction(req)
    return result
  } catch (e: unknown) {
    await killTransaction(req)
    throw e
  }
}
