import type { Payload, TypedUser } from 'payload'

import { cookies as getCookies } from 'next/headers.js'

import type { MultiTenantPluginConfig } from '../../types.js'

import { getTenantOptions } from '../../utilities/getTenantOptions.js'
import { TenantSelectionProviderClient } from './index.client.js'

type Args<ConfigType> = {
  children: React.ReactNode
  payload: Payload
  tenantsArrayFieldName: string
  tenantsArrayTenantFieldName: string
  tenantsCollectionSlug: string
  useAsTitle: string
  user: TypedUser
  userHasAccessToAllTenants: Required<
    MultiTenantPluginConfig<ConfigType>
  >['userHasAccessToAllTenants']
}

export const TenantSelectionProvider = async ({
  children,
  payload,
  tenantsArrayFieldName,
  tenantsArrayTenantFieldName,
  tenantsCollectionSlug,
  useAsTitle,
  user,
  userHasAccessToAllTenants,
}: Args<any>) => {
  const hasAccessToAllTenants = Boolean(user && userHasAccessToAllTenants(user))
  const tenantOptions = await getTenantOptions({
    hasAccessToAllTenants,
    payload,
    tenantsArrayFieldName,
    tenantsArrayTenantFieldName,
    tenantsCollectionSlug,
    useAsTitle,
    user,
  })

  const cookies = await getCookies()
  const tenantCookie = cookies.get('payload-tenant')?.value
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
  if (!initialValue && !hasAccessToAllTenants && tenantOptions.length === 1) {
    initialValue = tenantOptions[0]?.value
  }

  return (
    <TenantSelectionProviderClient
      initialHasAccessToAllTenants={hasAccessToAllTenants}
      initialTenantOptions={tenantOptions}
      initialValue={initialValue}
      tenantsCollectionSlug={tenantsCollectionSlug}
    >
      {children}
    </TenantSelectionProviderClient>
  )
}
