import * as migration_20251203_212801_initial from './20251203_212801_initial'

export const migrations = [
  {
    up: migration_20251203_212801_initial.up,
    down: migration_20251203_212801_initial.down,
    name: '20251203_212801_initial',
  },
]
