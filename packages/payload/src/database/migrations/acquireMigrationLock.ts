import type { Payload } from '../../index.js'
import type { PayloadRequest } from '../../types/index.js'

export type AcquireLockResult = {
  acquired: boolean
  instanceId: string
}

export async function acquireMigrationLock({
  payload,
  skipLock = false,
  timeout = 300000,
}: {
  payload: Payload
  req: PayloadRequest
  skipLock?: boolean
  timeout?: number
}): Promise<AcquireLockResult> {
  if (skipLock) {
    payload.logger.warn({
      msg: 'Migration locking explicitly disabled. Run only one migration instance during bootstrap.',
    })
    return { acquired: true, instanceId: 'no-lock' }
  }

  if (!Number.isFinite(timeout) || timeout <= 0) {
    throw new Error('Migration lock timeout must be a positive finite number.')
  }

  if (!payload.db.tryAcquireMigrationLock || !payload.db.releaseMigrationLock) {
    throw new Error('This database adapter does not support atomic migration locking.')
  }

  const instanceId = crypto.randomUUID()
  const { acquired } = await payload.db.tryAcquireMigrationLock({ instanceId, timeout })

  return { acquired, instanceId }
}
