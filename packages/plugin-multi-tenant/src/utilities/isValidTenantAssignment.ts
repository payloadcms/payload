import type { PayloadRequest } from 'payload'

import type { MultiTenantPluginConfig } from '../types.js'

import { getTenantIDsFromValue } from './getTenantIDsFromValue.js'
import { getUserTenantIDs } from './getUserTenantIDs.js'

type Args = {
  previousValue?: unknown
  req: PayloadRequest
  tenantsArrayFieldName: string
  tenantsArrayTenantFieldName: string
  userHasAccessToAllTenants?: MultiTenantPluginConfig['userHasAccessToAllTenants']
  value: unknown
}

export const isValidTenantAssignment = ({
  previousValue,
  req,
  tenantsArrayFieldName,
  tenantsArrayTenantFieldName,
  userHasAccessToAllTenants,
  value,
}: Args): boolean => {
  const { user } = req

  if (user) {
    if (userHasAccessToAllTenants?.(user)) {
      return true
    }
  } else if (req.payloadAPI === 'local') {
    return true
  }

  const submittedDocumentTenantIDs = getTenantIDsFromValue(value)
  const storedDocumentTenantIDs = getTenantIDsFromValue(previousValue)

  if (!hasTenantValueChanged(submittedDocumentTenantIDs, storedDocumentTenantIDs)) {
    return true
  }

  if (submittedDocumentTenantIDs.length === 0) {
    return false
  }

  const userAssignedTenantIDs = getUserTenantIDs(user, {
    tenantsArrayFieldName,
    tenantsArrayTenantFieldName,
  })

  return submittedDocumentTenantIDs.every((tenantID) =>
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
