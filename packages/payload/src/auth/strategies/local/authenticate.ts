// @ts-strict-ignore
import crypto from 'crypto'
import scmp from 'scmp'

import type { TypeWithID } from '../../../collections/config/types.js'

type Doc = Record<string, unknown> & TypeWithID

type Args = {
  doc: Doc
  password: string
}

export const authenticateLocalStrategy = async ({ doc, password }: Args): Promise<Doc | null> => {
  try {
    const { hash, salt } = doc

    if (typeof salt === 'string' && typeof hash === 'string') {
      const res = await new Promise<Doc | null>((resolve, reject) => {
        crypto.pbkdf2(password, salt, 25000, 512, 'sha256', (e, hashBuffer) => {
          if (e) {
            reject(null)
          }

          if (scmp(hashBuffer, Buffer.from(hash, 'hex'))) {
            resolve(doc)
          } else {
            reject(null)
          }
        })
      })

      return res
    }

    return null
  } catch (err) {
    return null
  }
}
