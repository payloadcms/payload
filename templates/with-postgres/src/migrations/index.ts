import * as migration_20250729_205119_initial from './20250729_205119_initial'

export const migrations = [
  {
    up: migration_20250729_205119_initial.up,
    down: migration_20250729_205119_initial.down,
    name: '20250729_205119_initial',
  },
]
