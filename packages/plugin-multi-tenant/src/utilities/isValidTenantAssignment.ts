import type { PayloadRequest, TypedUser } from 'payload'

import type { MultiTenantPluginConfig } from '../types.js'

import { getTenantIDsFromValue } from './getTenantIDsFromValue.js'
import { getUserTenantIDs } from './getUserTenantIDs.js'

type Args<ConfigType = unknown> = {
  /**
   * The tenant already stored on the document, when there is one.
   */
  previousValue?: unknown
  req: PayloadRequest
  tenantsArrayFieldName: string
  tenantsArrayTenantFieldName: string
  userHasAccessToAllTenants?: MultiTenantPluginConfig<ConfigType>['userHasAccessToAllTenants']
  value: unknown
}

/**
 * Whether the submitted tenant value is one the user is allowed to assign.
 *
 * Reads the user's assignments from `req` rather than querying, so it can't conflict with the
 * write's own transaction. Allows all-tenants users, unchanged values, and userless Local API
 * writes (seeds, migrations); rejects assigning an unassigned tenant or clearing an existing one.
 */
export const isValidTenantAssignment = <ConfigType = unknown>({
  previousValue,
  req,
  tenantsArrayFieldName,
  tenantsArrayTenantFieldName,
  userHasAccessToAllTenants,
  value,
}: Args<ConfigType>): boolean => {
  const { user } = req

  if (user) {
    if (
      userHasAccessToAllTenants?.(
        user as ConfigType extends { user: unknown } ? ConfigType['user'] : TypedUser,
      )
    ) {
      return true
    }
  } else if (req.payloadAPI === 'local') {
    // Seeds, migrations and scripts. There is no user to check against, and this is
    // server-side code rather than an inbound request. An unauthenticated REST or
    // GraphQL request keeps `payloadAPI` set to that API, so it is still checked.
    return true
  }

  const submittedDocTenantIDs = getTenantIDsFromValue(value)
  const storedDocTenantIDs = getTenantIDsFromValue(previousValue)

  if (!hasTenantValueChanged(submittedDocTenantIDs, storedDocTenantIDs)) {
    return true
  }

  if (submittedDocTenantIDs.length === 0) {
    // deny clearing an existing tenant
    return false
  }

  const userAssignedTenantIDs = getUserTenantIDs(user, {
    tenantsArrayFieldName,
    tenantsArrayTenantFieldName,
  })

  return submittedDocTenantIDs.every((tenantID) =>
    userAssignedTenantIDs.some(
      (userAssignedTenantID) => String(userAssignedTenantID) === String(tenantID),
    ),
  )
}

const hasTenantValueChanged = (
  submittedTenantIDs: (number | string)[],
  storedTenantIDs: (number | string)[],
): boolean =>
  submittedTenantIDs.length !== storedTenantIDs.length ||
  submittedTenantIDs.some((tenantID) => !storedTenantIDs.includes(tenantID))
