import * as migration_20251208_015438_initial from './20251208_015438_initial'

export const migrations = [
  {
    up: migration_20251208_015438_initial.up,
    down: migration_20251208_015438_initial.down,
    name: '20251208_015438_initial',
  },
]
