import * as migration_20241204_184240_initial from './20241204_184240_initial'

export const migrations = [
  {
    up: migration_20241204_184240_initial.up,
    down: migration_20241204_184240_initial.down,
    name: '20241204_184240_initial',
  },
]
