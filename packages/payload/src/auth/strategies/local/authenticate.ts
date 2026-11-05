// @ts-strict-ignore
import crypto from 'crypto'

import type { TypeWithID } from '../../../collections/config/types.js'
import type { SanitizedConfig } from '../../../config/types.js'

import { InvalidConfiguration } from '../../../errors/index.js'
import {
  getPasswordHashParameters,
  isCurrentPasswordHash,
  isUnsupportedIterationsError,
  pbkdf2Promisified,
} from './generatePasswordSaltHash.js'

type Doc = Record<string, unknown> & TypeWithID

type AuthenticationResult = {
  doc: Doc
  shouldUpdatePasswordHash: boolean
}

type Args = {
  doc: Doc
  password: string
  passwordHashIterations: SanitizedConfig['auth']['passwordHashIterations']
}

export const authenticateLocalStrategy = async ({
  doc,
  password,
  passwordHashIterations,
}: Args): Promise<AuthenticationResult | null> => {
  try {
    const { hash, salt } = doc

    if (typeof salt === 'string' && typeof hash === 'string') {
      const { hash: storedHash, iterations, keyLength } = getPasswordHashParameters(hash)
      const hashBuffer = await pbkdf2Promisified({ iterations, keyLength, password, salt })
      const storedHashBuffer = Buffer.from(storedHash, 'hex')

      if (
        hashBuffer.length === storedHashBuffer.length &&
        crypto.timingSafeEqual(hashBuffer, storedHashBuffer)
      ) {
        return {
          doc,
          shouldUpdatePasswordHash: !isCurrentPasswordHash({ hash, passwordHashIterations }),
        }
      }
    }

    return null
  } catch (err) {
    // Without this error, the failed login would count against the user's login attempts
    if (isUnsupportedIterationsError(err)) {
      throw new InvalidConfiguration(
        "This environment does not support the PBKDF2 iterations of this user's stored password hash. The user must reset their password.",
      )
    }

    return null
  }
}
