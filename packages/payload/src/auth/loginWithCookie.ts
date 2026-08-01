import type { Collection } from '../collections/config/types.js'
import type { AuthCollectionSlug } from '../index.js'
import type { PayloadRequest } from '../types/index.js'
import type { generateCookie } from './cookies.js'
import type { LoginOptions, LoginResult } from './operations/login.js'

import { getPayloadOperation, invokeOperation } from '../operations/index.js'
import { generatePayloadCookie } from './cookies.js'

type CookieObject = Extract<ReturnType<typeof generateCookie<true>>, { name: string }>

type LoginWithCookieArgs<TReturnCookieAsObject extends boolean> = {
  collection: Collection
  data: LoginOptions<AuthCollectionSlug>['data']
  depth?: number
  overrideAccess?: boolean
  req: PayloadRequest
  /** Return the cookie as parts rather than a serialized header string. */
  returnCookieAsObject?: TReturnCookieAsObject
}

/**
 * Runs the login operation and builds the auth cookie from its token, then
 * applies `auth.removeTokenFromResponses` to the returned result.
 *
 * The order matters: the token has to be read before the flag strips it, or the
 * caller ends up returning a user with no way to establish a session. Shared by
 * the REST login handler and the framework adapters' `login` server function so
 * that ordering only exists in one place.
 */
export const loginWithCookie = async <
  TSlug extends AuthCollectionSlug,
  TReturnCookieAsObject extends boolean = false,
>({
  collection,
  data,
  depth,
  overrideAccess,
  req,
  returnCookieAsObject,
}: LoginWithCookieArgs<TReturnCookieAsObject>): Promise<{
  cookie: TReturnCookieAsObject extends true ? CookieObject : string
  result: LoginResult<TSlug>
}> => {
  const result = await invokeOperation(getPayloadOperation('auth', 'login'), {
    context: req.payload,
    input: {
      collection: collection.config.slug as TSlug,
      data,
      depth,
      overrideAccess: overrideAccess ?? false,
      req,
    },
    validate: false,
  })

  const cookie = generatePayloadCookie({
    collectionAuthConfig: collection.config.auth,
    cookiePrefix: req.payload.config.cookiePrefix,
    returnCookieAsObject: returnCookieAsObject ?? false,
    token: result.token!,
  }) as TReturnCookieAsObject extends true ? CookieObject : string

  if (collection.config.auth.removeTokenFromResponses) {
    delete result.token
  }

  return { cookie, result }
}
