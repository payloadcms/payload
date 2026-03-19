/**
 * Coordinates schema push across workers using KV: only one worker pushes,
 * others wait and connect with schemaAlreadyPushed. Supports short lock TTL
 * with extension by the active pusher, and abort when a different schema/connection
 * version is requested (fingerprint change).
 */

import { randomUUID } from 'crypto'

/**
 * Rejected into the schema-push race when another worker requests a newer fingerprint.
 * The coordinator treats this as a yield (outcome `aborted`), not a connect failure.
 */
class SchemaPushAbortedError extends Error {
  override name = 'SchemaPushAbortedError'

  constructor(message = 'Schema push aborted: different version requested') {
    super(message)
  }
}

type LockValue = { id: string; t: number }

/** Fingerprint plus monotonic request time for ordering concurrent schema claims. */
type FingerprintRecord = { t: number; v: string }

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
      return { id: o.id, t: o.t }
    }
  } catch {
    // ignore
  }
  return null
}

function stringifyLock(value: LockValue): string {
  return JSON.stringify(value)
}

function parseFingerprintRecord(raw: unknown): FingerprintRecord | null {
  if (raw == null || typeof raw !== 'string') {
    return null
  }
  try {
    const o = JSON.parse(raw) as { t?: unknown; v?: unknown }
    if (typeof o?.v === 'string' && typeof o?.t === 'number' && Number.isFinite(o.t)) {
      return { t: o.t, v: o.v }
    }
  } catch {
    // ignore
  }
  return null
}

function stringifyFingerprintRecord(record: FingerprintRecord): string {
  return JSON.stringify(record)
}

/**
 * - already_pushed: our fingerprint is in KV, or another worker completed a push whose request time is
 *   ≥ when we started waiting on the lock (or ≥ our own request time, to cover work done before the loop runs).
 * - pushed: we ran runPush() and set the pushed fingerprint (and its request timestamp).
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

  private async getRequested(): Promise<FingerprintRecord | null> {
    const raw = await this.store.get(SchemaPushCoordinator.REQUESTED_KEY)
    return parseFingerprintRecord(raw)
  }

  private async getSchemaPushed(): Promise<FingerprintRecord | null> {
    const raw = await this.store.get(SchemaPushCoordinator.PUSHED_KEY)
    return parseFingerprintRecord(raw)
  }

  private isLockHeld(lock: LockValue | null): boolean {
    return lock != null && Date.now() - lock.t < SchemaPushCoordinator.LOCK_TTL_MS
  }

  /** Another worker requested a different fingerprint at or after our request time. */
  private async isNewerVersionRequested(
    schemaFingerprint: string,
    ourRequestTimestamp: number,
  ): Promise<boolean> {
    const requested = await this.getRequested()
    if (requested == null) {
      return false
    }
    if (requested.v === schemaFingerprint) {
      return false
    }
    return requested.t >= ourRequestTimestamp
  }

  /** Deletes the lock only if it is still owned by this instance (matching lockId). */
  private async releaseLock(): Promise<void> {
    const current = await this.getLock()
    if (current?.id === this.lockId) {
      await this.deleteLock()
    }
  }

  private async setLock(): Promise<void> {
    await this.store.set(
      SchemaPushCoordinator.LOCK_KEY,
      stringifyLock({ id: this.lockId, t: Date.now() }),
    )
  }

  private async setRequested(fingerprint: string): Promise<FingerprintRecord> {
    const record: FingerprintRecord = { t: Date.now(), v: fingerprint }
    await this.store.set(SchemaPushCoordinator.REQUESTED_KEY, stringifyFingerprintRecord(record))
    return record
  }

  /** Persists the fingerprint and the time it was requested (same record as {@link setRequested} for this push). */
  private async setSchemaPushed(record: FingerprintRecord): Promise<void> {
    await this.store.set(SchemaPushCoordinator.PUSHED_KEY, stringifyFingerprintRecord(record))
  }

  /**
   * Runs the schema push coordination: wait for an existing pusher or acquire the lock,
   * run runPush() while extending the lock and checking for abort (different version requested).
   * - aborted: this schema request expired. waits for push to complete and returns `aborted`.
   * - already_pushed: this schema was already pushed. doesnt run push.
   * - pushed: this schema was pushed. waits for push to complete and returns `pushed`.
   */
  async coordinate(options: CoordinateOptions): Promise<CoordinateSchemaPushResult> {
    const coordStart = Date.now()
    const { runPush, schemaFingerprint } = options
    if (schemaFingerprint === undefined) {
      throw new Error('SchemaPushCoordinator.coordinate requires schemaFingerprint')
    }
    const { EXTEND_INTERVAL_MS, POLL_MS } = SchemaPushCoordinator
    const cached = await this.getSchemaPushed()
    // this or newer schema was already pushed
    if (cached) {
      if (cached.v === schemaFingerprint || cached.t >= coordStart) {
        return { outcome: 'already_pushed' }
      }
    }

    const ourRequest = await this.setRequested(schemaFingerprint)

    let lock = await this.getLock()
    let waitLoopBeganAt: number | undefined

    // wait for other workers to complete their work
    while (this.isLockHeld(lock)) {
      waitLoopBeganAt ??= Date.now()
      const done = await this.getSchemaPushed()
      if (done) {
        // this or a newer schema was pushed
        if (done.v === schemaFingerprint || done.t >= waitLoopBeganAt) {
          return { outcome: 'already_pushed' }
        }
        // older schema was pushed -> continue waiting
      }
      await new Promise((r) => setTimeout(r, POLL_MS))
      lock = await this.getLock()
    }

    let extendIntervalId: ReturnType<typeof setInterval> | undefined
    const abortPromise = new Promise<never>((_, reject) => {
      extendIntervalId = setInterval(async () => {
        try {
          if (await this.isNewerVersionRequested(schemaFingerprint, ourRequest.t)) {
            clearInterval(extendIntervalId)
            extendIntervalId = undefined
            // release lock early to allow another worker to push.
            await this.releaseLock()
            reject(new SchemaPushAbortedError())
            return
          }
          // extend lock if still alive
          await this.setLock()
        } catch (e) {
          clearInterval(extendIntervalId)
          extendIntervalId = undefined
          reject(e instanceof Error ? e : new Error(String(e)))
        }
      }, EXTEND_INTERVAL_MS)
    })

    const pushPromise = runPush()

    try {
      // acquire lock
      await this.setLock()
      // races push vs abort due to newer version requested or unknown error
      await Promise.race([pushPromise, abortPromise])
      // push completed without abort
      await this.setSchemaPushed(ourRequest)
      return { outcome: 'pushed' }
    } catch (e) {
      // aborted or failed before push completed
      // ... wait for push to complete
      await pushPromise

      if (e instanceof SchemaPushAbortedError) {
        return { outcome: 'aborted' }
      }
      // unknown error
      throw e
    } finally {
      if (extendIntervalId != null) {
        clearInterval(extendIntervalId)
      }
      await this.releaseLock()
    }
  }
}
