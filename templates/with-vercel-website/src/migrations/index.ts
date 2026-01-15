import * as migration_20260115_002423_initial from './20260115_002423_initial'

export const migrations = [
  {
    up: migration_20260115_002423_initial.up,
    down: migration_20260115_002423_initial.down,
    name: '20260115_002423_initial',
  },
]
