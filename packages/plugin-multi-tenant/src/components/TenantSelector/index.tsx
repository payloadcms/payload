import type { ServerProps } from 'payload'

import { cookies as getCookies } from 'next/headers.js'
import React from 'react'

import type { MultiTenantPluginConfig, Tenant, UserWithTenantsField } from '../../types.js'

import { TenantSelectorClient } from './index.client.js'

type Args = {
  tenantsCollectionSlug: MultiTenantPluginConfig['tenantsSlug']
  useAsTitle: string
  user?: UserWithTenantsField
} & ServerProps

export const TenantSelector = async ({
  payload,
  tenantsCollectionSlug,
  useAsTitle,
  user,
}: Args) => {
  const { docs: userTenants } = await payload.find({
    collection: tenantsCollectionSlug,
    depth: 0,
    limit: 1000,
    overrideAccess: false,
    sort: useAsTitle,
    user,
  })

  const tenantOptions = userTenants.map((doc: Tenant) => ({
    label: String(doc[useAsTitle]),
    value: String(doc.id),
  }))

  let cookieToSet: string | undefined
  const cookies = await getCookies()
  const selectedTenant = tenantOptions.find(
    (tenant) => tenant.value === cookies.get('payload-tenant')?.value,
  )?.value

  if (!selectedTenant && userTenants.length > 0) {
    cookieToSet = String(userTenants[0].id)
  }

  return (
    <TenantSelectorClient
      cookieToSet={cookieToSet}
      initialValue={selectedTenant}
      options={tenantOptions}
    />
  )
}
