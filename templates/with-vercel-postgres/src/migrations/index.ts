import * as migration_20251203_212724_initial from './20251203_212724_initial'

export const migrations = [
  {
    up: migration_20251203_212724_initial.up,
    down: migration_20251203_212724_initial.down,
    name: '20251203_212724_initial',
  },
]
