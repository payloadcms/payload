import type { Access } from 'payload'

import { isSuperAdmin } from '../../../access/isSuperAdmin'
import { getTenantAdminTenantAccessIDs } from '../../../utilities/getTenantAccessIDs'
import { User } from '@/payload-types'

export const updateAndDeleteAccess: Access = (args) => {
  const { req, data } : {req:any, data:User} = args

  if (!req.user) {
    return false
  }

  if (isSuperAdmin(args)) {
    return true
  }

  const adminTenantAccessIDs = getTenantAdminTenantAccessIDs(req.user)

  // if no data, then the GUI is asking if we are allowed to create users at all
  if (adminTenantAccessIDs.length &&!data){
    return true
  }
  
  // If you're only a tenant-admin, then you can't delete super-admins
  if (data.roles?.includes('super-admin')){
    return false
  }

  // Can delete a user, only if you're an admin in *all* of their tenants
  return data.tenants?.every((tenant) => 
    adminTenantAccessIDs.includes(typeof(tenant.tenant) === 'string' ?
       tenant.tenant : tenant.tenant.id)
  )

}
