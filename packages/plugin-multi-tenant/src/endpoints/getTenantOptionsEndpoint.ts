import type { Endpoint, OptionObject } from 'payload'

import { APIError } from 'payload'

import type { MultiTenantPluginConfig } from '../types.js'

import { getTenantOptions } from '../utilities/getTenantOptions.js'

export type GetTenantOptionsResponse = {
  hasAccessToAllTenants: boolean
  tenantOptions: OptionObject[]
}

export const getTenantOptionsEndpoint = <ConfigType>({
  tenantsArrayFieldName,
  tenantsArrayTenantFieldName,
  tenantsCollectionSlug,
  useAsTitle,
  userHasAccessToAllTenants,
}: {
  tenantsArrayFieldName: string
  tenantsArrayTenantFieldName: string
  tenantsCollectionSlug: string
  useAsTitle: string
  userHasAccessToAllTenants: Required<
    MultiTenantPluginConfig<ConfigType>
  >['userHasAccessToAllTenants']
}): Endpoint => ({
  handler: async (req) => {
    const { payload, user } = req

    if (!user) {
      throw new APIError('Unauthorized', 401)
    }

    const hasAccessToAllTenants = userHasAccessToAllTenants(
      user as Parameters<typeof userHasAccessToAllTenants>[0],
    )
    const tenantOptions = await getTenantOptions({
      hasAccessToAllTenants,
      payload,
      tenantsArrayFieldName,
      tenantsArrayTenantFieldName,
      tenantsCollectionSlug,
      useAsTitle,
      user,
    })

    const result: GetTenantOptionsResponse = { hasAccessToAllTenants, tenantOptions }

    return new Response(JSON.stringify(result))
  },
  method: 'get',
  path: '/populate-tenant-options',
})
