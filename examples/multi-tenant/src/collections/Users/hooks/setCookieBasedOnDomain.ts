import type { CollectionAfterLoginHook } from 'payload'

import { generateCookie, getCookieExpiration } from 'payload'

export const setCookieBasedOnDomain: CollectionAfterLoginHook = async ({ req, user }) => {
  const relatedOrg = await req.payload.find({
    collection: 'tenants',
    depth: 0,
    limit: 1,
    where: {
      'domains.domain': {
        in: [req.headers.get('host')],
      },
    },
  })

  // If a matching tenant is found, set the 'payload-tenant' cookie
  if (relatedOrg) {
    const cookieString = generateCookie({
      name: 'payload-tenant',
      expires: getCookieExpiration({ seconds: 7200 }),
      path: '/',
      returnCookieAsObject: false,
      value: relatedOrg.id,
    })
    req.responseHeaders = new Headers({
      'Set-Cookie': cookieString as string,
    })
  }

  return user
}
