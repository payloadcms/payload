import type { Payload, PayloadRequest } from 'payload'

import { commitTransaction, initTransaction, killTransaction } from 'payload'

export interface AcquireLockResult {
  acquired: boolean
  instanceId: string
}

export async function acquireMigrationLock({
  payload,
  req,
  timeout = 300000,
}: {
  payload: Payload
  req: PayloadRequest
  timeout?: number
}): Promise<AcquireLockResult> {
  // Check if transactions are available
  if (!payload.db.beginTransaction) {
    payload.logger.warn({
      msg: 'Migration locking requires transactions. Skipping lock - not safe for multi-instance deployments.',
    })
    return { acquired: true, instanceId: 'no-lock' }
  }

  // Generate unique instance ID
  const instanceId = crypto.randomUUID()

  try {
    // Start transaction for atomic lock acquisition
    await initTransaction(req)

    // Read current lock state
    const lock = await payload.findGlobal({
      slug: 'payload-migrations-lock',
      req,
    })

    const now = new Date()
    const isLocked = lock.locked && lock.expires_at && lock.expires_at > now

    // Check if already locked by another instance
    if (isLocked) {
      await killTransaction(req)
      return { acquired: false, instanceId }
    }

    // Detect stale lock
    if (lock.locked && lock.expires_at && lock.expires_at <= now) {
      payload.logger.warn({
        expired_at: lock.expires_at,
        msg: `Stale migration lock detected from instance ${lock.locked_by}. Lock expired at ${lock.expires_at}. Proceeding with lock acquisition.`,
        previous_locked_by: lock.locked_by,
      })
    }

    // Acquire lock
    await payload.updateGlobal({
      slug: 'payload-migrations-lock',
      data: {
        expires_at: new Date(Date.now() + timeout),
        locked: true,
        locked_at: now,
        locked_by: instanceId,
      },
      req,
    })

    // Commit transaction
    await commitTransaction(req)

    return { acquired: true, instanceId }
  } catch (err) {
    await killTransaction(req)
    throw err
  }
}
