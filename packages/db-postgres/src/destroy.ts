import type { Destroy } from 'payload/database'

import type { PostgresAdapter } from './types.js'

import { pushDevSchema } from './utilities/pushDevSchema.js'

export const destroy: Destroy = async function destroy(this: PostgresAdapter) {
  if (process.env.NODE_ENV !== 'production') {
    await pushDevSchema(this)
  } else {
    // TODO: this hangs test suite for some reason
    // await this.pool.end()
  }
}
