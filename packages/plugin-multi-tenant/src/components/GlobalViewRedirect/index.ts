import type { CollectionSlug, ServerProps, ViewTypes } from 'payload'

import { redirect } from 'next/navigation.js'

import { getGlobalViewRedirect } from '../../utilities/getGlobalViewRedirect.js'

type Args = {
  collectionSlug: CollectionSlug
  docID?: number | string
  globalSlugs: string[]
  tenantFieldName: string
  viewType: ViewTypes
} & ServerProps

export const GlobalViewRedirect = async (args: Args) => {
  const collectionSlug = args?.collectionSlug

  if (collectionSlug && args.globalSlugs?.includes(collectionSlug)) {
    const redirectRoute = await getGlobalViewRedirect({
      slug: collectionSlug,
      docID: args.docID,
      payload: args.payload,
      tenantFieldName: args.tenantFieldName,
      view: args.viewType,
    })

    if (redirectRoute) {
      redirect(redirectRoute)
    }
  }
}
