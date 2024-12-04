import * as migration_20241204_034849_initial from './20241204_034849_initial'

export const migrations = [
  {
    up: migration_20241204_034849_initial.up,
    down: migration_20241204_034849_initial.down,
    name: '20241204_034849_initial',
  },
]
