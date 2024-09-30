import type { CollectionAfterLoginHook } from 'payload'

import { parseCookies } from 'payload'

export const setCookieBasedOnDomain: CollectionAfterLoginHook = async ({ context, req, user }) => {
  const cookies = parseCookies(req.headers)

  const selectedTenant = cookies.get('payload-tenant')

  console.log('cookies before: ', cookies)

  console.log('Selected Tenant: ', selectedTenant)

  console.log('Host :', req.headers.get('host'))

  console.log('Context: ', context)

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

  console.log('Related Org: ', relatedOrg)

  console.log('REQ: ', req)

  // If a matching tenant is found, set the 'payload-tenant' cookie
  if (relatedOrg) {
    // res.cookie('payload-tenant', relatedOrg.id, {
    //   httpOnly: true, // Optional: Secure the cookie, prevents client-side access
    //   sameSite: 'Lax', // Adjust this if needed, but 'Lax' is a good default
    //   secure: process.env.NODE_ENV === 'production', // Use 'Secure' flag in production
    // })
    cookies.set('payload-tenant', relatedOrg.id)
  }

  console.log('cookies after: ', cookies)

  return user
}
