import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { AuthenticatedUser } from '../index.js'
import type { PayloadRequest } from '../types/index.js'

import { afterRead } from '../fields/hooks/afterRead/index.js'
import { deepCopyObjectSimple } from '../utilities/deepCopyObject.js'

/** Runs an authenticated user through the collection's read pipeline. */
export const applyUserReadAccess = async ({
  collection,
  depth,
  overrideAccess,
  req,
  showHiddenFields,
  user,
}: {
  collection: SanitizedCollectionConfig
  depth?: number
  overrideAccess: boolean
  req: PayloadRequest
  showHiddenFields: boolean
  user: AuthenticatedUser
}): Promise<AuthenticatedUser> => {
  const authenticationMetadata = {
    ...(user._sid !== undefined ? { _sid: user._sid } : {}),
    _strategy: user._strategy,
    collection: user.collection,
  }

  let userWithReadAccess = await afterRead({
    collection,
    context: req.context,
    depth: depth!,
    doc: deepCopyObjectSimple(user),
    draft: false,
    fallbackLocale: req.fallbackLocale!,
    global: null,
    locale: req.locale!,
    overrideAccess,
    req,
    showHiddenFields,
  })

  if (collection.hooks?.afterRead?.length) {
    for (const hook of collection.hooks.afterRead) {
      userWithReadAccess =
        (await hook({
          collection,
          context: req.context,
          doc: userWithReadAccess,
          overrideAccess,
          req,
        })) || userWithReadAccess
    }
  }

  return {
    ...userWithReadAccess,
    ...authenticationMetadata,
  }
}
