import type { SanitizedGlobalPermission } from '../../auth/index.js'
import type { AllOperations, JsonObject, PayloadRequest } from '../../types/index.js'
import type { SanitizedGlobalConfig } from '../config/types.js'

import { commitTransaction } from '../../utilities/commitTransaction.js'
import { getEntityPermissions } from '../../utilities/getEntityPermissions/getEntityPermissions.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { sanitizePermissions } from '../../utilities/sanitizePermissions.js'

type Arguments = {
  /**
   * If the document data is passed, it will be used to check access instead of fetching the document from the database.
   */
  data?: JsonObject
  globalConfig: SanitizedGlobalConfig
  req: PayloadRequest
}

export const docAccessOperation = async (args: Arguments): Promise<SanitizedGlobalPermission> => {
  const { data, globalConfig, req } = args

  const globalOperations: AllOperations[] = ['read', 'update']

  if (globalConfig.versions) {
    globalOperations.push('readVersions')
  }

  try {
    const result = await getEntityPermissions({
      id: undefined,
      blockReferencesPermissions: {},
      data,
      entity: globalConfig,
      entityType: 'global',
      fetchData: true,
      operations: globalOperations,
      req,
    })

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
