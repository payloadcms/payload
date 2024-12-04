import * as migration_20241204_154113_initial from './20241204_154113_initial'

export const migrations = [
  {
    up: migration_20241204_154113_initial.up,
    down: migration_20241204_154113_initial.down,
    name: '20241204_154113_initial',
  },
]
