import * as migration_20251024_213307_initial from './20251024_213307_initial'

export const migrations = [
  {
    up: migration_20251024_213307_initial.up,
    down: migration_20251024_213307_initial.down,
    name: '20251024_213307_initial',
  },
]
