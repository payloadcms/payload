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
    label: String(doc[useAsTitle as 'id']),
    value: doc.id as string,
  }))

  return tenantOptions
}
