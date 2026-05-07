import * as migration_20260507_221443_initial from './20260507_221443_initial'

export const migrations = [
  {
    up: migration_20260507_221443_initial.up,
    down: migration_20260507_221443_initial.down,
    name: '20260507_221443_initial',
  },
]
