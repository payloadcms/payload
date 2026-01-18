import type { Endpoint } from '@ruya.sa/payload'

import { APIError } from '@ruya.sa/payload'

import type { MultiTenantPluginConfig } from '../types.js'

import { getTenantOptions } from '../utilities/getTenantOptions.js'

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

    const tenantOptions = await getTenantOptions({
      payload,
      tenantsArrayFieldName,
      tenantsArrayTenantFieldName,
      tenantsCollectionSlug,
      useAsTitle,
      user,
      userHasAccessToAllTenants,
    })

    return new Response(JSON.stringify({ tenantOptions }))
  },
  method: 'get',
  path: '/populate-tenant-options',
})
