import type { OptionObject, ServerProps } from 'payload'

import { cookies as getCookies } from 'next/headers.js'
import React from 'react'

import type { UserWithTenantsField } from '../../types.js'

import { TenantSelectorClient } from './index.client.js'

type Args = {
  tenantsCollectionSlug: string
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

  const tenantOptions: OptionObject[] = userTenants.map((doc) => ({
    label: String(doc[useAsTitle]),
    value: String(doc.id),
  }))

  const cookies = await getCookies()
  let selectedTenant = tenantOptions.find(
    (tenant) => tenant.value === cookies.get('payload-tenant')?.value,
  )?.value

  if (!selectedTenant && userTenants?.[0]) {
    selectedTenant = String(userTenants[0].id)
  }

  return <TenantSelectorClient initialValue={selectedTenant} options={tenantOptions} />
}
