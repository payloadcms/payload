import * as migration_20241204_032921_initial from './20241204_032921_initial'

export const migrations = [
  {
    up: migration_20241204_032921_initial.up,
    down: migration_20241204_032921_initial.down,
    name: '20241204_032921_initial',
  },
]
