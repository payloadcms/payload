import * as migration_20251009_155521_initial from './20251009_155521_initial'

export const migrations = [
  {
    up: migration_20251009_155521_initial.up,
    down: migration_20251009_155521_initial.down,
    name: '20251009_155521_initial',
  },
]
