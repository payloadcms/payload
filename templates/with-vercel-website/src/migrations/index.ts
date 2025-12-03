import * as migration_20251203_212743_initial from './20251203_212743_initial'

export const migrations = [
  {
    up: migration_20251203_212743_initial.up,
    down: migration_20251203_212743_initial.down,
    name: '20251203_212743_initial',
  },
]
