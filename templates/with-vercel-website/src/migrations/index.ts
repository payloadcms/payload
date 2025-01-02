import * as migration_20241221_132944_initial from './20241221_132944_initial'

export const migrations = [
  {
    up: migration_20241221_132944_initial.up,
    down: migration_20241221_132944_initial.down,
    name: '20241221_132944_initial',
  },
]
