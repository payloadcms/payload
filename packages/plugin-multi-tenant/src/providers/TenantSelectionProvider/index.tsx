import type { OptionObject, Payload, User } from 'payload'

import { cookies as getCookies } from 'next/headers.js'

import { TenantSelectionProviderClient } from './index.client.js'

type Args = {
  children: React.ReactNode
  payload: Payload
  tenantsCollectionSlug: string
  useAsTitle: string
  user: User
}

export const TenantSelectionProvider = async ({
  children,
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
  const tenantCookie = cookies.get('payload-tenant')?.value
  const selectedTenant =
    tenantOptions.find((option) => option.value === tenantCookie)?.label || tenantCookie

  return (
    <span data-selected-tenant-id={tenantCookie} data-selected-tenant-title={selectedTenant}>
      <TenantSelectionProviderClient initialValue={tenantCookie} tenantOptions={tenantOptions}>
        {children}
      </TenantSelectionProviderClient>
    </span>
  )
}
