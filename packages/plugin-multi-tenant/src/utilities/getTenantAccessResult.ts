import type { AccessArgs, AccessResult, Where } from 'payload'

import type { AllAccessKeys } from '../types.js'
import type { TenantAccessConfig } from './addCollectionAccess.js'

import { getTenantAccess } from './getTenantAccess.js'

export const getTenantAccessResult = ({
  accessKey,
  accessResult,
  accessResultCallback,
  adminUsersSlug,
  args,
  collection,
  fieldName,
  tenantsArrayFieldName,
  tenantsArrayTenantFieldName,
  userHasAccessToAllTenants,
}: {
  accessKey: AllAccessKeys[number]
  accessResult: AccessResult
  args: AccessArgs
} & TenantAccessConfig): AccessResult | Promise<AccessResult> => {
  const applyAccessResultOverride = (result: AccessResult): AccessResult | Promise<AccessResult> =>
    accessResultCallback
      ? accessResultCallback({ accessKey, accessResult: result, ...args })
      : result

  if (!accessResult) {
    return applyAccessResultOverride(false)
  }

  const user = args.req.user

  if (!user || user.collection !== adminUsersSlug || userHasAccessToAllTenants(user)) {
    return applyAccessResultOverride(accessResult)
  }

  const tenantConstraint = getTenantAccess({
    fieldName,
    tenantsArrayFieldName,
    tenantsArrayTenantFieldName,
    user,
  })

  if (tenantConstraint[fieldName]?.in.length === 0) {
    return applyAccessResultOverride(
      collection.slug === user.collection ? { id: { equals: user.id } } : false,
    )
  }

  const tenantResult: Where =
    collection.slug === user.collection
      ? { or: [{ id: { equals: user.id } }, tenantConstraint] }
      : tenantConstraint

  return applyAccessResultOverride(
    accessResult === true ? tenantResult : { and: [accessResult, tenantResult] },
  )
}
