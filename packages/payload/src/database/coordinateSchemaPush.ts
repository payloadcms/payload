/**
 * Coordinates schema push across workers using KV: only one worker pushes,
 * others wait and connect with schemaAlreadyPushed. Supports short lock TTL
 * with extension by the active pusher, and abort when a different schema/connection
 * version is requested (fingerprint change).
 */

import { randomUUID } from 'crypto'

type LockValue = { id: string; t: number; v: string }

type SchemaPushKV = {
  delete: (key: string) => Promise<void>
  get: (key: string) => Promise<unknown>
  set: (key: string, value: string) => Promise<void>
}

function parseLock(raw: unknown): LockValue | null {
  if (raw == null || typeof raw !== 'string') {
    return null
  }
  try {
    const o = JSON.parse(raw) as LockValue
    if (typeof o?.t === 'number' && typeof o?.id === 'string') {
      return { id: o.id, t: o.t, v: typeof o.v === 'string' ? o.v : '' }
    }
  } catch {
    // ignore
  }
  return null
}

function stringifyLock(value: LockValue): string {
  return JSON.stringify(value)
}

/**
 * - already_pushed: this schema fingerprint was pushed by another worker; connect with schemaAlreadyPushed.
 * - pushed: we ran runPush() and set the pushed fingerprint.
 * - aborted: another process has a newer claim (different fingerprint requested) or we yielded; connect without coordination.
 */
type CoordinateSchemaPushResult =
  | { outcome: 'aborted' }
  | { outcome: 'already_pushed' }
  | { outcome: 'pushed' }

type SchemaPushCoordinatorOptions = {
  kvStore?: SchemaPushKV
}

type CoordinateOptions = {
  runPush: () => Promise<void>
  schemaFingerprint?: string
}

/**
 * Coordinates schema push across workers using the KV store: one worker pushes,
 * others wait and connect with schemaAlreadyPushed. Initialize with the store; call coordinate() to run.
 */
export class SchemaPushCoordinator {
  /** How often to extend the lock while pushing (ms). */
  private static readonly EXTEND_INTERVAL_MS = 500
  private static readonly LOCK_KEY = 'db:schema-push-lock'
  /** Lock considered stale after this many ms. */
  private static readonly LOCK_TTL_MS = 1_200

  /** Poll interval while waiting for lock (ms). */
  private static readonly POLL_MS = 300
  private static readonly PUSHED_KEY = 'db:schema-pushed'
  private static readonly REQUESTED_KEY = 'db:schema-push-requested'

  private readonly lockId: string
  private readonly store: SchemaPushKV

  constructor(options: SchemaPushCoordinatorOptions) {
    if (options.kvStore === undefined) {
      throw new Error('SchemaPushCoordinator requires kvStore')
    }
    this.lockId = randomUUID()
    this.store = options.kvStore
  }

  private async deleteLock(): Promise<void> {
    await this.store.delete(SchemaPushCoordinator.LOCK_KEY)
  }

  private async getLock(): Promise<LockValue | null> {
    const raw = await this.store.get(SchemaPushCoordinator.LOCK_KEY)
    return parseLock(raw)
  }

  private async getRequested(): Promise<null | string> {
    const raw = await this.store.get(SchemaPushCoordinator.REQUESTED_KEY)
    return typeof raw === 'string' ? raw : null
  }

  private async getSchemaPushed(): Promise<null | string> {
    const raw = await this.store.get(SchemaPushCoordinator.PUSHED_KEY)
    return typeof raw === 'string' ? raw : null
  }

  /** Deletes the lock only if it is still owned by this instance (matching lockId). */
  private async releaseLock(): Promise<void> {
    const current = await this.getLock()
    if (current?.id === this.lockId) {
      await this.deleteLock()
    }
  }

  private async setLock(schemaFingerprint: string): Promise<void> {
    await this.store.set(
      SchemaPushCoordinator.LOCK_KEY,
      stringifyLock({ id: this.lockId, t: Date.now(), v: schemaFingerprint }),
    )
  }

  private async setRequested(value: string): Promise<void> {
    await this.store.set(SchemaPushCoordinator.REQUESTED_KEY, value)
  }

  private async setSchemaPushed(value: string): Promise<void> {
    await this.store.set(SchemaPushCoordinator.PUSHED_KEY, value)
  }

  /**
   * Runs the schema push coordination: wait for an existing pusher or acquire the lock,
   * run runPush() while extending the lock and checking for abort (different version requested).
   */
  async coordinate(options: CoordinateOptions): Promise<CoordinateSchemaPushResult> {
    const { runPush, schemaFingerprint } = options
    if (schemaFingerprint === undefined) {
      throw new Error('SchemaPushCoordinator.coordinate requires schemaFingerprint')
    }
    const { EXTEND_INTERVAL_MS, LOCK_TTL_MS, POLL_MS } = SchemaPushCoordinator
    // Skip push if this schema fingerprint was already pushed by another worker.
    const cachedVersion = await this.getSchemaPushed()
    if (cachedVersion === schemaFingerprint) {
      return { outcome: 'already_pushed' }
    }

    // Signal which fingerprint we want so a pusher for a different version can abort.
    await this.setRequested(schemaFingerprint)

    let lock = await this.getLock()

    // Wait while another worker (or this worker, identified by lockId) holds a non-stale lock.
    while (lock != null && Date.now() - lock.t < LOCK_TTL_MS) {
      const done = await this.getSchemaPushed()
      if (done === schemaFingerprint) {
        return { outcome: 'already_pushed' }
      }
      // Newest wins: if someone else requested a different (newer) fingerprint, abort so they can push.
      const requested = await this.getRequested()
      if (requested != null && requested !== schemaFingerprint) {
        return { outcome: 'aborted' }
      }
      await new Promise((r) => setTimeout(r, POLL_MS))
      lock = await this.getLock()
    }

    // Acquire lock and run push; extend lock periodically so it doesn't expire while we're pushing.
    await this.setLock(schemaFingerprint)

    let extendIntervalId: ReturnType<typeof setInterval> | undefined
    const abortPromise = new Promise<never>((_, reject) => {
      extendIntervalId = setInterval(async () => {
        try {
          const requested = await this.getRequested()
          if (requested != null && requested !== schemaFingerprint) {
            // Another worker wants a different fingerprint (e.g. schema/connection changed); release lock and abort.
            clearInterval(extendIntervalId)
            extendIntervalId = undefined
            await this.releaseLock()
            const err = new Error('Schema push aborted: different version requested')
            ;(err as { schemaPushAborted: true } & Error).schemaPushAborted = true
            reject(err)
            return
          }
          await this.setLock(schemaFingerprint)
        } catch (e) {
          clearInterval(extendIntervalId)
          extendIntervalId = undefined
          reject(e instanceof Error ? e : new Error(String(e)))
        }
      }, EXTEND_INTERVAL_MS)
    })

    try {
      await Promise.race([runPush(), abortPromise])
      await this.setSchemaPushed(schemaFingerprint)
      return { outcome: 'pushed' }
    } catch (e) {
      if ((e as { schemaPushAborted?: boolean })?.schemaPushAborted) {
        return { outcome: 'aborted' }
      }
      throw e
    } finally {
      if (extendIntervalId != null) {
        clearInterval(extendIntervalId)
      }
      await this.releaseLock()
    }
  }
}
