import type { FieldHook } from 'payload'

import { getTenantAccessIDs } from '../../../utilities/getTenantAccessIDs'

export const autofillTenant: FieldHook = ({ req, value }) => {
  // If there is no value,
  // and the user only has one tenant,
  // return that tenant ID as the value
  if (!value) {
    const tenantIDs = getTenantAccessIDs(req.user)
    if (tenantIDs.length === 1) {return tenantIDs[0]}
  }

  return value
}
