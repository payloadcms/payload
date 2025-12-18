import * as migration_20251218_211052_initial from './20251218_211052_initial'

export const migrations = [
  {
    up: migration_20251218_211052_initial.up,
    down: migration_20251218_211052_initial.down,
    name: '20251218_211052_initial',
  },
]
