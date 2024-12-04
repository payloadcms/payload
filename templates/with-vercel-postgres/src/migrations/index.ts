import * as migration_20241204_032906_initial from './20241204_032906_initial'

export const migrations = [
  {
    up: migration_20241204_032906_initial.up,
    down: migration_20241204_032906_initial.down,
    name: '20241204_032906_initial',
  },
]
