import type { CollectionAfterLoginHook } from 'payload'

import { mergeHeaders, generateCookie, getCookieExpiration } from 'payload'

export const setCookieBasedOnDomain: CollectionAfterLoginHook = async ({ req, user }) => {
  const relatedOrg = await req.payload.find({
    collection: 'tenants',
    depth: 0,
    limit: 1,
    where: {
      domain: {
        equals: req.headers.get('host'),
      },
    },
  })

  // If a matching tenant is found, set the 'payload-tenant' cookie
  if (relatedOrg && relatedOrg.docs.length > 0) {
    const tenantCookie = generateCookie({
      name: 'payload-tenant',
      expires: getCookieExpiration({ seconds: 7200 }),
      path: '/',
      returnCookieAsObject: false,
      value: String(relatedOrg.docs[0].id),
    })

    // Merge existing responseHeaders with the new Set-Cookie header
    const newHeaders = new Headers({
      'Set-Cookie': tenantCookie as string,
    })

    // Ensure you merge existing response headers if they already exist
    req.responseHeaders = req.responseHeaders
      ? mergeHeaders(req.responseHeaders, newHeaders)
      : newHeaders
  }

  return user
}
