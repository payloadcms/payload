import type { CollectionSlug, ServerProps, ViewTypes } from 'payload'

import { headers as getHeaders } from 'next/headers.js'
import { redirect } from 'next/navigation.js'

import { getGlobalViewRedirect } from '../../utilities/getGlobalViewRedirect.js'

type Args = {
  basePath?: string
  collectionSlug: CollectionSlug
  docID?: number | string
  globalSlugs: string[]
  tenantFieldName: string
  tenantsCollectionSlug: string
  useAsTitle: string
  viewType: ViewTypes
} & ServerProps

export const GlobalViewRedirect = async (args: Args) => {
  const collectionSlug = args?.collectionSlug
  if (collectionSlug && args.globalSlugs?.includes(collectionSlug)) {
    const headers = await getHeaders()
    const redirectRoute = await getGlobalViewRedirect({
      slug: collectionSlug,
      basePath: args.basePath,
      docID: args.docID,
      headers,
      payload: args.payload,
      tenantFieldName: args.tenantFieldName,
      tenantsCollectionSlug: args.tenantsCollectionSlug,
      useAsTitle: args.useAsTitle,
      user: args.user,
      view: args.viewType,
    })

    if (redirectRoute) {
      redirect(redirectRoute)
    }
  }
}
