import type { Payload, ServerAdapter, TypedUser } from 'payload'

import type { MultiTenantPluginConfig } from '../../types.js'

import { getTenantOptions } from '../../utilities/getTenantOptions.js'
import { TenantSelectionProviderClient } from './index.client.js'

type Args<ConfigType> = {
  children: React.ReactNode
  payload: Payload
  server?: ServerAdapter
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
  server,
  tenantsArrayFieldName,
  tenantsArrayTenantFieldName,
  tenantsCollectionSlug,
  useAsTitle,
  user,
  userHasAccessToAllTenants,
}: Args<any>) => {
  if (!server) {
    throw new Error(
      'TenantSelectionProvider requires `server` in ServerProps. Ensure your framework adapter (e.g. @payloadcms/next) populates ServerProps.server.',
    )
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

  const cookies = await server.getCookies()
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
  if (!initialValue) {
    initialValue = tenantOptions.length > 1 ? undefined : tenantOptions[0]?.value
  }

  return (
    <TenantSelectionProviderClient
      initialTenantOptions={tenantOptions}
      initialValue={initialValue}
      tenantsCollectionSlug={tenantsCollectionSlug}
    >
      {children}
    </TenantSelectionProviderClient>
  )
}
