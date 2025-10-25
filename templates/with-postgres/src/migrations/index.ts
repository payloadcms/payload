import * as migration_20251023_155321_initial from './20251023_155321_initial'

export const migrations = [
  {
    up: migration_20251023_155321_initial.up,
    down: migration_20251023_155321_initial.down,
    name: '20251023_155321_initial',
  },
]
