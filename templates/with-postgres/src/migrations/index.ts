import * as migration_20260115_002429_initial from './20260115_002429_initial'

export const migrations = [
  {
    up: migration_20260115_002429_initial.up,
    down: migration_20260115_002429_initial.down,
    name: '20260115_002429_initial',
  },
]
