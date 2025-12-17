import * as migration_20251216_194325_initial from './20251216_194325_initial'

export const migrations = [
  {
    up: migration_20251216_194325_initial.up,
    down: migration_20251216_194325_initial.down,
    name: '20251216_194325_initial',
  },
]
