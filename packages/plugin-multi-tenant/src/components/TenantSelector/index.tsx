import type { ServerProps } from 'payload'

import { cookies as getCookies } from 'next/headers.js'
import React from 'react'

import type { MultiTenantPluginConfig, Tenant, UserWithTenantsField } from '../../types.js'

import { getUserTenantIDs } from '../../utilities/getUserTenantIDs.js'
import { TenantSelector } from './index.client.js'

type Args = {
  tenantsCollectionSlug: MultiTenantPluginConfig['tenantsSlug']
  user?: UserWithTenantsField
  userHasAccessToAllTenants?: MultiTenantPluginConfig['userHasAccessToAllTenants']
} & ServerProps

export const TenantSelectorRSC = async ({
  payload,
  tenantsCollectionSlug,
  user,
  userHasAccessToAllTenants,
}: Args) => {
  const userTenants = user ? getUserTenantIDs(user) : []
  const userHasAccessToAllTenantsFn = userHasAccessToAllTenants(user)

  const { docs } = await payload.find({
    collection: tenantsCollectionSlug,
    depth: 0,
    limit: 100,
    sort: 'name',
    where: userHasAccessToAllTenantsFn ? {} : { id: { in: userTenants } },
  })

  const tenantOptions = docs.map((doc: Tenant) => ({
    label: doc.name,
    value: String(doc.id),
  }))

  // If the user only has access to one or less tenants, don't show the selector
  if (tenantOptions.length <= 1 && !userHasAccessToAllTenantsFn) {
    return null
  }

  const cookies = await getCookies()
  let selectedTenant = cookies.get('payload-tenant')?.value

  if (
    userTenants.length > 0 &&
    selectedTenant &&
    !tenantOptions.find((opt) => opt.value === selectedTenant)
  ) {
    // Unset the tenant if the user does not have access to cookie tenant
    cookies.delete('payload-tenant')
    selectedTenant = null
  }

  return <TenantSelector initialValue={selectedTenant} options={tenantOptions} />
}
