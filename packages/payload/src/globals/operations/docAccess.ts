import type { SanitizedGlobalPermission } from '../../auth/index.js'
import type { AllOperations, PayloadRequest } from '../../types/index.js'
import type { SanitizedGlobalConfig } from '../config/types.js'

import { commitTransaction } from '../../utilities/commitTransaction.js'
import { getEntityPermissions } from '../../utilities/getEntityPermissions/getEntityPermissions.js'
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
    const result = await getEntityPermissions({
      id: undefined,
      blockReferencesPermissions: {},
      entity: globalConfig,
      entityType: 'global',
      fetchData: true,
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

    const globalPermissions = sanitizedPermissions?.globals?.[globalConfig.slug]
    return globalPermissions ?? { fields: {} }
  } catch (e: unknown) {
    await killTransaction(req)
    throw e
  }
}
