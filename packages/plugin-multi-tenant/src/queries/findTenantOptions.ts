import type { PaginatedDocs, Payload, User } from 'payload'

type Args = {
  payload: Payload
  tenantsCollectionSlug: string
  useAsTitle: string
  user?: User
}
export const findTenantOptions = async ({
  payload,
  tenantsCollectionSlug,
  useAsTitle,
  user,
}: Args): Promise<PaginatedDocs> => {
  return payload.find({
    collection: tenantsCollectionSlug,
    depth: 0,
    limit: 1,
    overrideAccess: false,
    select: {
      id: true,
    },
    sort: useAsTitle,
    user,
  })
}
