import type { User } from '../../../payload-types'

export const checkTenantRoles = (
  allRoles: User['tenants'][0]['roles'] = [],
  user: User = undefined,
  tenant: User['tenants'][0]['tenant'] = undefined,
): boolean => {
  if (tenant) {
    const id = typeof tenant === 'string' ? tenant : tenant?.id

    if (
      allRoles.some(role => {
        return user?.tenants?.some(({ tenant: userTenant, roles }) => {
          const tenantID = typeof userTenant === 'string' ? userTenant : userTenant?.id
          return tenantID === id && roles?.includes(role)
        })
      })
    )
      return true
  }

  return false
}
