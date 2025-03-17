import type { OptionObject, Payload, User } from 'payload'

import { cookies as getCookies } from 'next/headers.js'

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
      value: doc.id,
    }))
  } catch (_) {
    // user likely does not have access
  }

  const cookies = await getCookies()
  let tenantCookie = cookies.get('payload-tenant')?.value
  let initialValue = undefined

  /**
   * Ensure the cookie is a valid tenant
   */
  if (tenantCookie) {
    const matchingOption = tenantOptions.find((option) => String(option.value) === tenantCookie)
    if (matchingOption) {
      initialValue = matchingOption.value
    }
  }

  /**
   * If the there was no cookie or the cookie was an invalid tenantID set intialValue
   */
  if (!initialValue) {
    tenantCookie = undefined
    initialValue = tenantOptions.length > 1 ? undefined : tenantOptions[0]?.value
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
