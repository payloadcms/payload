import type { PayloadRequest } from '../types/index.js'

import { UnauthorizedError } from '../errors/UnauthorizedError.js'

/**
 * Whether the requesting user satisfies Payload's admin-access rule:
 * a. pass the `access.admin` function on their auth collection, if defined
 * b. otherwise, match the `config.admin.user` property on the Payload config
 *
 * Unlike {@link canAccessAdmin}, this has no "no users yet" bootstrap allowance -
 * an unauthenticated caller is never an administrator. Use this when another
 * feature (e.g. `payload-api-keys` access control) needs the same "is this user
 * an administrator" decision Payload uses for admin-only routes.
 */
export const isAdministrator = async ({ req }: { req: PayloadRequest }): Promise<boolean> => {
  const incomingUserSlug = req.user?.collection

  if (!incomingUserSlug) {
    return false
  }

  const adminAccessFn = req.payload.collections[incomingUserSlug]?.config.access?.admin

  if (adminAccessFn) {
    return Boolean(await adminAccessFn({ slug: incomingUserSlug, req }))
  }

  return req.payload.config.admin.user === incomingUserSlug
}

/**
 * Protects admin-only routes, server functions, etc.
 * The requesting user must either:
 * a. pass the `access.admin` function on the `users` collection, if defined
 * b. match the `config.admin.user` property on the Payload config
 * c. if no user is present, and there are no users in the system, allow access (for first user creation)
 * @throws {Error} Throws an `Unauthorized` error if access is denied that can be explicitly caught
 */
export const canAccessAdmin = async ({ req }: { req: PayloadRequest }) => {
  if (req.user?.collection) {
    if (!(await isAdministrator({ req }))) {
      throw new UnauthorizedError()
    }
  } else {
    const hasUsers = await req.payload.find({
      collection: req.payload.config.admin.user,
      depth: 0,
      limit: 1,
      pagination: false,
    })

    // If there are users, we should not allow access because of `/create-first-user`
    if (hasUsers.docs.length) {
      throw new UnauthorizedError()
    }
  }
}
