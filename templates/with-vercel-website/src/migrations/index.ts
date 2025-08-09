import * as migration_20250729_205058_initial from './20250729_205058_initial'

export const migrations = [
  {
    up: migration_20250729_205058_initial.up,
    down: migration_20250729_205058_initial.down,
    name: '20250729_205058_initial',
  },
]
