import type { OptionObject, Payload, TypedUser } from 'payload'

import type { MultiTenantPluginConfig } from '../types.js'

export const getTenantOptions = async ({
  payload,
  tenantsArrayFieldName,
  tenantsArrayTenantFieldName,
  tenantsCollectionSlug,
  useAsTitle,
  user,
  userHasAccessToAllTenants,
}: {
  payload: Payload
  tenantsArrayFieldName: string
  tenantsArrayTenantFieldName: string
  tenantsCollectionSlug: string
  useAsTitle: string
  user: TypedUser
  userHasAccessToAllTenants: Required<MultiTenantPluginConfig<any>>['userHasAccessToAllTenants']
}): Promise<OptionObject[]> => {
  let tenantOptions: OptionObject[] = []

  if (!user) {
    return tenantOptions
  }

  if (userHasAccessToAllTenants(user)) {
    // If the user has access to all tenants get them from the DB
    const isOrderable = payload.collections[tenantsCollectionSlug]?.config?.orderable || false
    const tenants = await payload.find({
      collection: tenantsCollectionSlug,
      depth: 0,
      limit: 0,
      overrideAccess: false,
      select: {
        [useAsTitle]: true,
        ...(isOrderable && { _order: true }),
      },
      sort: isOrderable ? '_order' : useAsTitle,
      user,
    })

    tenantOptions = tenants.docs.map((doc) => ({
      label: String(doc[useAsTitle as 'id']), // useAsTitle is dynamic but the type thinks we are only selecting `id` | `_order`
      value: doc.id as string,
    }))
  } else {
    const tenantsToPopulate: (number | string)[] = []

    // i.e. users.tenants
    ;((user[tenantsArrayFieldName] as { [key: string]: any }[]) || []).map((tenantRow) => {
      const tenantField = tenantRow[tenantsArrayTenantFieldName] // tenants.tenant
      if (typeof tenantField === 'string' || typeof tenantField === 'number') {
        tenantsToPopulate.push(tenantField)
      } else if (tenantField && typeof tenantField === 'object') {
        tenantOptions.push({
          label: String(tenantField[useAsTitle]),
          value: tenantField.id,
        })
      }
    })

    if (tenantsToPopulate.length > 0) {
      const populatedTenants = await payload.find({
        collection: tenantsCollectionSlug,
        depth: 0,
        limit: 0,
        overrideAccess: false,
        user,
        where: {
          id: {
            in: tenantsToPopulate,
          },
        },
      })

      tenantOptions = populatedTenants.docs.map((doc) => ({
        label: String(doc[useAsTitle]),
        value: doc.id as string,
      }))
    }
  }

  return tenantOptions
}
