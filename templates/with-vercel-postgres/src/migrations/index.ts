import * as migration_20241221_131503_initial from './20241221_131503_initial'

export const migrations = [
  {
    up: migration_20241221_131503_initial.up,
    down: migration_20241221_131503_initial.down,
    name: '20241221_131503_initial',
  },
]
