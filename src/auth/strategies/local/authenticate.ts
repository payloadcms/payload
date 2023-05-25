import crypto from 'crypto'
import scmp from 'scmp'
import { TypeWithID } from "../../../collections/config/types"
import { AuthenticationError } from "../../../errors"

type Args = {
  doc: TypeWithID & Record<string, unknown>
  password: string
}

export const authenticateLocalStrategy = async ({
  doc,
  password,
}: Args): Promise<TypeWithID & Record<string, unknown>> => {
  try {
    const salt = doc.salt
    const hash = doc.hash

    if (typeof salt === 'string' && typeof hash === 'string') {
      await new Promise((resolve) => {
        crypto.pbkdf2(password, salt, 25000, 512, 'sha256', (e, hashBuffer) => {
          if (e) throw e

          if (scmp(hashBuffer, Buffer.from(hash, 'hex'))) {
            resolve(doc)
          } else {
            return null
          }
        });
      })

      return doc
    }

    return null
  } catch (err) {
    return null
  }
}