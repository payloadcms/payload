import type { AccessArgs, CollectionConfig } from 'payload'

import type { TenantAccessConfig } from './addCollectionAccess.js'

import { collectionAccessKeys } from './collectionAccessKeys.js'
import { getTenantAccessResult } from './getTenantAccessResult.js'

export const addTenantCollectionAccess = (accessConfig: TenantAccessConfig): CollectionConfig => {
  const access = { ...accessConfig.collection.access }
  const updateAccessFallback = access.update

  for (const accessKey of collectionAccessKeys) {
    // A collection without its own `validate` access is governed by `update`, matching core's
    // fallback contract, rather than the generic "any authenticated user" default below.
    const accessFunction =
      accessConfig.collection.access?.[accessKey] ??
      (accessKey === 'validate' ? updateAccessFallback : undefined) ??
      (({ req }: AccessArgs) => Boolean(req.user))

    access[accessKey] = async (args) =>
      getTenantAccessResult({
        ...accessConfig,
        accessKey,
        accessResult: await accessFunction(args),
        args,
        fieldName:
          accessKey === 'readVersions'
            ? `version.${accessConfig.fieldName}`
            : accessConfig.fieldName,
      })
  }

  return { ...accessConfig.collection, access }
}
