import * as migration_20241221_131507_initial from './20241221_131507_initial'

export const migrations = [
  {
    up: migration_20241221_131507_initial.up,
    down: migration_20241221_131507_initial.down,
    name: '20241221_131507_initial',
  },
]
