import { setTimeout } from 'node:timers/promises'

/** Retry only SQLite writer contention; database and schema errors must still propagate. */
export async function migrationLockRetry<T>({
  isSQLite,
  operation,
}: {
  isSQLite: boolean
  operation: () => Promise<T>
}): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await operation()
    } catch (err) {
      if (!isSQLite || attempt >= 5 || !isWriterContention({ err })) {
        throw err
      }

      await setTimeout(25 * 2 ** attempt)
    }
  }
}

function isWriterContention({ err }: { err: unknown }): boolean {
  if (!err || typeof err !== 'object') {
    return false
  }

  if (
    'code' in err &&
    typeof err.code === 'string' &&
    /^(?:SQLITE_BUSY|SQLITE_LOCKED)/.test(err.code)
  ) {
    return true
  }

  return 'cause' in err && err.cause !== err && isWriterContention({ err: err.cause })
}
