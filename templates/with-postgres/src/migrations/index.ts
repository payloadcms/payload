import * as migration_20241221_080814_initial from './20241221_080814_initial'

export const migrations = [
  {
    up: migration_20241221_080814_initial.up,
    down: migration_20241221_080814_initial.down,
    name: '20241221_080814_initial',
  },
]
