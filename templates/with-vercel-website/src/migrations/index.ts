import * as migration_20251024_213247_initial from './20251024_213247_initial'

export const migrations = [
  {
    up: migration_20251024_213247_initial.up,
    down: migration_20251024_213247_initial.down,
    name: '20251024_213247_initial',
  },
]
