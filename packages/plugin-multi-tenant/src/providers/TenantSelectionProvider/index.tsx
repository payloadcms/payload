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
  let tenantOptions: OptionObject[] = []

  try {
    const { docs: userTenants } = await payload.find({
      collection: tenantsCollectionSlug,
      depth: 0,
      limit: 1000,
      overrideAccess: false,
      sort: useAsTitle,
      user,
    })

    tenantOptions = userTenants.map((doc) => ({
      label: String(doc[useAsTitle]),
      value: String(doc.id),
    }))
  } catch (_) {
    // user likely does not have access
  }

  const cookies = await getCookies()
  const tenantCookie = cookies.get('payload-tenant')?.value

  return (
    <TenantSelectionProviderClient initialValue={tenantCookie} tenantOptions={tenantOptions}>
      {children}
    </TenantSelectionProviderClient>
  )
}
