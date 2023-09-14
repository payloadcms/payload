import type { BinaryLike } from 'crypto'

import { createHash } from 'crypto'

export const oneWayHash = (data: BinaryLike, secret: string): string => {
  const hash = createHash('sha256')

  // prepend value with payload secret. This ensure one-way.
  hash.update(secret)

  // Update is an append operation, not a replacement. The secret from the prior
  // update is still present!
  hash.update(data)
  return hash.digest('hex')
}
