import type { GlobalPermission } from '../../auth'
import type { PayloadRequest } from '../../express/types'
import type { AllOperations } from '../../types'
import type { SanitizedGlobalConfig } from '../config/types'

import { getEntityPolicies } from '../../utilities/getEntityPolicies'

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

  return getEntityPolicies({
    entity: globalConfig,
    operations: globalOperations,
    req,
    type: 'global',
  })
}
