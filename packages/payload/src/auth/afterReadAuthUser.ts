import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { AuthenticatedUser } from '../index.js'
import type { PayloadRequest } from '../types/index.js'

import { afterRead } from '../fields/hooks/afterRead/index.js'

/** Runs the shared field read pipeline before returning an authenticated user. */
export const afterReadAuthUser = async ({
  collection,
  depth,
  overrideAccess,
  req,
  showHiddenFields,
  triggerHooks = true,
  user,
}: {
  collection: SanitizedCollectionConfig
  depth: number
  overrideAccess: boolean
  req: PayloadRequest
  showHiddenFields: boolean
  /** Skips hooks that already ran during the authentication lookup. */
  triggerHooks?: boolean
  user: AuthenticatedUser
}): Promise<AuthenticatedUser> => {
  let result = await afterRead({
    collection,
    context: req.context,
    depth,
    doc: user,
    draft: false,
    fallbackLocale: req.fallbackLocale!,
    global: null,
    locale: req.locale!,
    overrideAccess,
    req,
    showHiddenFields,
    triggerHooks,
  })

  if (triggerHooks && collection.hooks?.afterRead?.length) {
    for (const hook of collection.hooks.afterRead) {
      result =
        (await hook({
          collection,
          context: req.context,
          doc: result,
          overrideAccess,
          req,
        })) || result
    }
  }

  return result
}
