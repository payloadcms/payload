import * as migration_20260115_002416_initial from './20260115_002416_initial'

export const migrations = [
  {
    up: migration_20260115_002416_initial.up,
    down: migration_20260115_002416_initial.down,
    name: '20260115_002416_initial',
  },
]
