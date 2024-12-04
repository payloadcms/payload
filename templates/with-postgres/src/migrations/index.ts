import * as migration_20241204_154138_initial from './20241204_154138_initial'

export const migrations = [
  {
    up: migration_20241204_154138_initial.up,
    down: migration_20241204_154138_initial.down,
    name: '20241204_154138_initial',
  },
]
