import type { Payload } from '../../index.js'
import type { PayloadRequest } from '../../types/index.js'

export async function releaseMigrationLock({
  instanceId,
  payload,
}: {
  instanceId: string
  payload: Payload
  req: PayloadRequest
}): Promise<void> {
  // Skip if no locking was used
  if (instanceId === 'no-lock') {
    return
  }

  if (!payload.db.releaseMigrationLock) {
    throw new Error('This database adapter does not support atomic migration locking.')
  }

  await payload.db.releaseMigrationLock({ instanceId })
}
