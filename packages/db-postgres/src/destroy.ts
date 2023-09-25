import type { Destroy } from 'payload/database'

import type { PostgresAdapter } from './types'

export const destroy: Destroy = async function destroy (this: PostgresAdapter) {
  await this.pool.end()
}
