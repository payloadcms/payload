import type { CollectionSlug, ServerProps, ViewTypes } from 'payload'

import type { MultiTenantPluginConfig } from '../../types.js'

import { getGlobalViewRedirect } from '../../utilities/getGlobalViewRedirect.js'

type Args = {
  collectionSlug: CollectionSlug
  docID?: number | string
  globalSlugs: string[]
  tenantArrayFieldName: string
  tenantArrayTenantFieldName: string
  tenantFieldName: string
  tenantsCollectionSlug: string
  useAsTitle: string
  userHasAccessToAllTenants: Required<MultiTenantPluginConfig>['userHasAccessToAllTenants']
  viewType: ViewTypes
} & ServerProps

export const GlobalViewRedirect = async (args: Args) => {
  const collectionSlug = args?.collectionSlug
  if (collectionSlug && args.globalSlugs?.includes(collectionSlug)) {
    if (!args.server) {
      throw new Error(
        'GlobalViewRedirect requires `server` in ServerProps. Ensure your framework adapter (e.g. @payloadcms/next) populates ServerProps.server.',
      )
    }
    const headers = await args.server.getHeaders()
    const redirectRoute = await getGlobalViewRedirect({
      slug: collectionSlug,
      docID: args.docID,
      headers,
      payload: args.payload,
      server: args.server,
      tenantFieldName: args.tenantFieldName,
      tenantsArrayFieldName: args.tenantArrayFieldName,
      tenantsArrayTenantFieldName: args.tenantArrayTenantFieldName,
      tenantsCollectionSlug: args.tenantsCollectionSlug,
      useAsTitle: args.useAsTitle,
      user: args.user,
      userHasAccessToAllTenants: args.userHasAccessToAllTenants,
      view: args.viewType,
    })

    if (redirectRoute) {
      args.server.redirect(redirectRoute)
    }
  }
}
