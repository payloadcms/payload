import type { AfterLoginHook } from 'payload/dist/collections/config/types'

export const recordLastLoggedInTenant: AfterLoginHook = async ({ req, user }) => {
  try {
    const relatedOrgs = await req.payload.find({
      collection: 'tenants',
      where: {
        'domains.domain': {
          in: [req.headers.host],
        },
      },
      depth: 0,
      limit: 1,
    })

    const relatedOrg = relatedOrgs?.docs?.[0]

    await req.payload.update({
      id: user.id,
      collection: 'users',
      data: {
        lastLoggedInTenant: relatedOrg?.id || null,
      },
    })
  } catch (err: unknown) {
    req.payload.logger.error(`Error recording last logged in tenant for user ${user.id}: ${err}`)
  }

  return user
}
