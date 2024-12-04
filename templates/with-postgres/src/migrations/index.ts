import * as migration_20241204_034859_initial from './20241204_034859_initial'

export const migrations = [
  {
    up: migration_20241204_034859_initial.up,
    down: migration_20241204_034859_initial.down,
    name: '20241204_034859_initial',
  },
]
