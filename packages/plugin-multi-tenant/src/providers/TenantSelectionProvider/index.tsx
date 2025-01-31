import type { OptionObject, Payload, User } from 'payload'

import { cookies as getCookies } from 'next/headers.js'

import { SELECT_ALL } from '../../constants.js'
import { findTenantOptions } from '../../queries/findTenantOptions.js'
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
    const { docs } = await findTenantOptions({
      limit: 0,
      payload,
      tenantsCollectionSlug,
      useAsTitle,
      user,
    })
    tenantOptions = docs.map((doc) => ({
      label: String(doc[useAsTitle]),
      value: String(doc.id),
    }))
  } catch (_) {
    // user likely does not have access
  }

  const cookies = await getCookies()
  let tenantCookie = cookies.get('payload-tenant')?.value
  let initialValue = undefined
  const isValidTenantCookie =
    (tenantOptions.length > 1 && tenantCookie === SELECT_ALL) ||
    tenantOptions.some((option) => option.value === tenantCookie)

  if (isValidTenantCookie) {
    initialValue = tenantCookie
  } else {
    tenantCookie = undefined
    initialValue = tenantOptions.length > 1 ? SELECT_ALL : tenantOptions[0]?.value
  }

  return (
    <TenantSelectionProviderClient
      initialValue={initialValue}
      tenantCookie={tenantCookie}
      tenantOptions={tenantOptions}
    >
      {children}
    </TenantSelectionProviderClient>
  )
}
