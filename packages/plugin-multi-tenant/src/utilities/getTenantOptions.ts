import type { OptionObject, Payload, User } from 'payload'

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
  user: User
  userHasAccessToAllTenants: Required<MultiTenantPluginConfig<any>>['userHasAccessToAllTenants']
}): Promise<OptionObject[]> => {
  let tenantOptions: OptionObject[] = []

  if (!user) {
    return tenantOptions
  }

  const isOrderable = payload.collections[tenantsCollectionSlug]?.config?.orderable || false

  const userTenantIds = !userHasAccessToAllTenants(user)
    ? (
        ((user as Record<string, unknown>)[tenantsArrayFieldName] as {
          [key: string]: unknown
        }[]) || []
      ).map((tenantRow) => {
        const tenantField = tenantRow[tenantsArrayTenantFieldName]
        if (typeof tenantField === 'string' || typeof tenantField === 'number') {
          return tenantField
        }
        if (tenantField && typeof tenantField === 'object' && 'id' in tenantField) {
          return tenantField.id as number | string
        }
      })
    : undefined

  if (userTenantIds !== undefined && userTenantIds.length === 0) {
    return tenantOptions
  }

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
    ...(userTenantIds && {
      where: {
        id: {
          in: userTenantIds,
        },
      },
    }),
  })

  tenantOptions = tenants.docs.map((doc) => ({
    label: String(doc[useAsTitle as 'id']),
    value: doc.id as string,
  }))

  return tenantOptions
}
