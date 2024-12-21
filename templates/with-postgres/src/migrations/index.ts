import * as migration_20241221_131510_initial from './20241221_131510_initial'

export const migrations = [
  {
    up: migration_20241221_131510_initial.up,
    down: migration_20241221_131510_initial.down,
    name: '20241221_131510_initial',
  },
]
