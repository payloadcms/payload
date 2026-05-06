import type { Payload, PayloadRequest } from 'payload'

export async function releaseMigrationLock({
  instanceId,
  payload,
  req,
}: {
  instanceId: string
  payload: Payload
  req: PayloadRequest
}): Promise<void> {
  // Skip if no locking was used
  if (instanceId === 'no-lock') {
    return
  }

  // Release lock (no transaction needed for simple update)
  await payload.updateGlobal({
    slug: 'payload-migrations-lock',
    data: { locked: false },
  })
}
