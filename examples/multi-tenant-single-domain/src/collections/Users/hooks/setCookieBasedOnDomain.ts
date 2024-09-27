import type { CollectionAfterLoginHook } from 'payload'

import { parseCookies } from 'payload'

export const setCookieBasedOnDomain: CollectionAfterLoginHook = async ({ req, user }) => {
  const cookies = parseCookies(req.headers)

  const relatedOrg = await req.payload
    .find({
      collection: 'tenants',
      depth: 0,
      limit: 1,
      where: {
        'domains.domain': {
          in: [req.headers.get('host')],
        },
      },
    })
    ?.then((res) => res.docs?.[0])

  // Set a cookie, automatically set that cookie based on the domain if it matches, if there is a domain field on the tenant
  if (relatedOrg) {
    cookies.set('payload-tenant', relatedOrg.id)
  }

  return user
}
