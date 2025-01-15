import type { CollectionAfterLoginHook } from 'payload'

import { mergeHeaders } from '@payloadcms/next/utilities'
import { generateCookie, getCookieExpiration } from 'payload'
import { TENANT_COOKIE_NAME } from '@/collections/Tenants/cookie'

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
  if (relatedOrg && relatedOrg.docs.length > 0) {
    const tenantCookie = generateCookie({
      name: TENANT_COOKIE_NAME,
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
