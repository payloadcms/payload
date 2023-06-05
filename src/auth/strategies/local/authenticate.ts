import crypto from 'crypto'
import scmp from 'scmp'
import { TypeWithID } from "../../../collections/config/types"
import { AuthenticationError } from "../../../errors"

type Doc = TypeWithID & Record<string, unknown>

type Args = {
  doc: Doc
  password: string
}

export const authenticateLocalStrategy = async ({
  doc,
  password,
}: Args): Promise<Doc | null> => {
  try {
    const salt = doc.salt
    const hash = doc.hash

    if (typeof salt === 'string' && typeof hash === 'string') {
      const res = await new Promise<Doc | null>((resolve, reject) => {
        crypto.pbkdf2(password, salt, 25000, 512, 'sha256', (e, hashBuffer) => {
          if (e) reject(null)

          if (scmp(hashBuffer, Buffer.from(hash, 'hex'))) {
            resolve(doc)
          } else {
            reject(null)
          }
        });
      })

      return res
    }

    return null
  } catch (err) {
    return null
  }
}