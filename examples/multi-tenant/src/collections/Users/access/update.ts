import type { Access, PayloadRequest } from 'payload'

import { isSuperAdmin } from '../../../access/isSuperAdmin'
import {
  getTenantAccessIDs,
  getTenantAdminTenantAccessIDs,
} from '../../../utilities/getTenantAccessIDs'
import { User } from '@/payload-types'

// TODO: Pull logic out, and separate update and delete.
// Need to allow for removal from tenants owned by calling user,
// but not deletion. Maybe complete deletion is a super-user task.

export const updateAccess: Access = async (args) => {
  const { req, data }: { req: PayloadRequest; data?: User } = args

  if (!req.user) {
    return false
  }

  if (isSuperAdmin({ req })) {
    return true
  }

  const adminTenantAccessIDs = getTenantAdminTenantAccessIDs(req.user)

  if (!data) {
    // Triggered by visit to the User collection on Admin console
    // If we return true, then this enables the "Create New" button
    // so, we do that if we're an admin of at least 1 tenant
    return Boolean(adminTenantAccessIDs.length)
  }

  // If you're only a tenant-admin, then you can't delete super-admins
  if (data.roles?.includes('super-admin')) {
    return false
  }

  // Can update a user, only if you're an admin in the tenants being changed
  const userBeingChangedPromise = req.payload.find({
    collection: 'users',
    where: {
      email: {
        equals: data.email,
      },
    },
  })

  // Now we check *who* we are accessing, and what's changing
  // Can't make self a super-admin
  if (req.user.id === data.id) {
    if (!req.user.roles?.includes('super-admin') && data.roles?.includes('super-admin')) {
      return false
    }
  }

  // Can't add/remove tenants we're not an admin of
  const userBeingChanged = (await userBeingChangedPromise).docs[0]
  const currentTenants = getTenantAccessIDs(userBeingChanged)
  const proposedTenants = getTenantAccessIDs(data)

  // figure out tenant changes
  const tenantsRemoved = proposedTenants.filter((id) => !currentTenants.includes(id))
  const tenantsAdded = currentTenants.filter((id) => !proposedTenants.includes(id))

  return (
    tenantsRemoved.every((id) => adminTenantAccessIDs.includes(id)) &&
    tenantsAdded.every((id) => adminTenantAccessIDs.includes(id))
  )
}
