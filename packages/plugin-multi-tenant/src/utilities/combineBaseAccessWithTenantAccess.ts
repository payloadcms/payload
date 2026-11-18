import type { Config } from 'payload'

import type { TenantAccessConfig } from './addCollectionAccess.js'

import { collectionAccessKeys } from './collectionAccessKeys.js'
import { getTenantAccessResult } from './getTenantAccessResult.js'

export const combineBaseAccessWithTenantAccess = ({
  accessConfigBySlug,
  baseAccess,
}: {
  accessConfigBySlug: Map<string, TenantAccessConfig>
  baseAccess: Config['baseAccess']
}): Config['baseAccess'] => {
  const originalBaseAccess = baseAccess?.collections || {}
  const collections: NonNullable<NonNullable<Config['baseAccess']>['collections']> = {
    ...originalBaseAccess,
  }

  for (const accessKey of collectionAccessKeys) {
    const baseAccessFunction =
      originalBaseAccess[accessKey] ??
      (accessKey === 'validate' ? originalBaseAccess.update : undefined)

    collections[accessKey] = async (args) => {
      const baseResult = baseAccessFunction ? await baseAccessFunction(args) : true
      const accessConfig = accessConfigBySlug.get(args.slug)

      if (!baseResult || !accessConfig) {
        return baseResult
      }

      if (accessKey === 'create' && typeof baseResult === 'object') {
        return baseResult
      }

      const tenantResult = await getTenantAccessResult({
        ...accessConfig,
        accessKey,
        accessResult: baseResult,
        args,
        fieldName:
          accessKey === 'readVersions'
            ? `version.${accessConfig.fieldName}`
            : accessConfig.fieldName,
      })

      return accessKey === 'create' ? Boolean(tenantResult) : tenantResult
    }
  }

  return {
    ...baseAccess,
    collections,
  }
}
