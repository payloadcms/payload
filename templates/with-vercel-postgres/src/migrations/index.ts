import * as migration_20260507_221425_initial from './20260507_221425_initial'

export const migrations = [
  {
    up: migration_20260507_221425_initial.up,
    down: migration_20260507_221425_initial.down,
    name: '20260507_221425_initial',
  },
]
