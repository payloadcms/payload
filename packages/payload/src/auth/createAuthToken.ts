import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { AuthenticatedUser } from '../index.js'
import type { PayloadRequest } from '../types/index.js'

import { getFieldsToSign } from './getFieldsToSign.js'
import { jwtSign } from './jwt.js'
import { addSessionToUser } from './sessions.js'

/**
 * Starts a login session for the user and signs the JWT for it, the same token a password login
 * returns. Payload's JWT strategy accepts it. The session is saved on the user right away.
 */
export const createAuthToken = async ({
  collectionConfig,
  email,
  req,
  user,
}: {
  collectionConfig: SanitizedCollectionConfig
  /** The `email` claim of the token. */
  email: string
  req: PayloadRequest
  user: AuthenticatedUser
}): Promise<{
  exp: number
  /**
   * The ID of the session the token belongs to. Removing that session from the user, like logout
   * does, makes the token stop working.
   */
  sid?: string
  token: string
}> => {
  const { sid } = await addSessionToUser({ collectionConfig, payload: req.payload, req, user })

  const { exp, token } = await jwtSign({
    fieldsToSign: getFieldsToSign({ collectionConfig, email, sid, user }),
    secret: req.payload.secret,
    tokenExpiration: collectionConfig.auth.tokenExpiration,
  })

  return { exp, sid, token }
}
