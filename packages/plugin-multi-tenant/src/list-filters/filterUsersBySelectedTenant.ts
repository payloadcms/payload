import type { PayloadRequest, TypeWithID, Where } from 'payload'

import { extractID } from 'payload/shared'

import { getCollectionIDType } from '../utilities/getCollectionIDType.js'
import { getTenantFromCookie } from '../utilities/getTenantFromCookie.js'

type Args = {
  req: PayloadRequest
  tenantsCollectionSlug: string
}
/**
 * Filter the list of users by the selected tenant
 */
export const filterUsersBySelectedTenant = async ({
  req,
  tenantsCollectionSlug,
}: Args): Promise<null | Where> => {
  const idType = getCollectionIDType({
    collectionSlug: tenantsCollectionSlug,
    payload: req.payload,
  })
  const selectedTenant = getTenantFromCookie(req.headers, idType)

  if (req.user && selectedTenant) {
    const doc = await req.payload.findByID({
      id: selectedTenant,
      collection: tenantsCollectionSlug,
      depth: 0,
      req,
      select: {
        assignedUsers: true,
      },
      user: req.user,
    })

    return {
      id: {
        in: (Array.isArray(doc?.assignedUsers) ? doc.assignedUsers : []).map(
          ({ user: tenantUser }: { user: TypeWithID }) => extractID(tenantUser),
        ),
      },
    }
  }

  return {}
}
