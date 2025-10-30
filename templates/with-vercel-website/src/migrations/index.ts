import * as migration_20251009_155501_initial from './20251009_155501_initial'

export const migrations = [
  {
    up: migration_20251009_155501_initial.up,
    down: migration_20251009_155501_initial.down,
    name: '20251009_155501_initial',
  },
]
