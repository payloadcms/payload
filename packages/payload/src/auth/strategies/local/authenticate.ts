// @ts-strict-ignore
import crypto from 'crypto'

import type { TypeWithID } from '../../../collections/config/types.js'
import type { SanitizedConfig } from '../../../config/types.js'

import { getPasswordHashParameters, isCurrentPasswordHash } from './generatePasswordSaltHash.js'

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
      const res = await new Promise<AuthenticationResult | null>((resolve, reject) => {
        crypto.pbkdf2(password, salt, iterations, keyLength, 'sha256', (e, hashBuffer) => {
          if (e) {
            return reject(e)
          }

          const storedHashBuffer = Buffer.from(storedHash, 'hex')

          if (
            hashBuffer.length === storedHashBuffer.length &&
            crypto.timingSafeEqual(hashBuffer, storedHashBuffer)
          ) {
            resolve({
              doc,
              shouldUpdatePasswordHash: !isCurrentPasswordHash({ hash, passwordHashIterations }),
            })
          } else {
            reject(new Error('Invalid password'))
          }
        })
      })

      return res
    }

    return null
  } catch (ignore) {
    return null
  }
}
