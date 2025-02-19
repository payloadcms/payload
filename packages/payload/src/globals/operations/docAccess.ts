// @ts-strict-ignore
import type { SanitizedGlobalPermission } from '../../auth/index.js'
import type { AllOperations, PayloadRequest } from '../../types/index.js'
import type { SanitizedGlobalConfig } from '../config/types.js'

import { commitTransaction } from '../../utilities/commitTransaction.js'
import { getEntityPolicies } from '../../utilities/getEntityPolicies.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { sanitizePermissions } from '../../utilities/sanitizePermissions.js'

type Arguments = {
  globalConfig: SanitizedGlobalConfig
  req: PayloadRequest
}

export const docAccessOperation = async (args: Arguments): Promise<SanitizedGlobalPermission> => {
  const { globalConfig, req } = args

  const globalOperations: AllOperations[] = ['read', 'update']

  if (globalConfig.versions) {
    globalOperations.push('readVersions')
  }

  try {
    const shouldCommit = await initTransaction(req)
    const result = await getEntityPolicies({
      type: 'global',
      blockPolicies: {},
      entity: globalConfig,
      operations: globalOperations,
      req,
    })
    if (shouldCommit) {
      await commitTransaction(req)
    }
    const sanitizedPermissions = sanitizePermissions({
      globals: {
        [globalConfig.slug]: result,
      },
    })

    return sanitizedPermissions?.globals?.[globalConfig.slug]
  } catch (e: unknown) {
    await killTransaction(req)
    throw e
  }
}
