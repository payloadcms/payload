import * as migration_20241204_154128_initial from './20241204_154128_initial'

export const migrations = [
  {
    up: migration_20241204_154128_initial.up,
    down: migration_20241204_154128_initial.down,
    name: '20241204_154128_initial',
  },
]
