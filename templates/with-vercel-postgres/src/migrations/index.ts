import * as migration_20251104_212823_initial from './20251104_212823_initial'

export const migrations = [
  {
    up: migration_20251104_212823_initial.up,
    down: migration_20251104_212823_initial.down,
    name: '20251104_212823_initial',
  },
]
