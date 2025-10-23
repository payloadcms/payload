import * as migration_20251023_155300_initial from './20251023_155300_initial'

export const migrations = [
  {
    up: migration_20251023_155300_initial.up,
    down: migration_20251023_155300_initial.down,
    name: '20251023_155300_initial',
  },
]
