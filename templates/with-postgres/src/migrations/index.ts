import * as migration_20260507_221522_initial from './20260507_221522_initial'

export const migrations = [
  {
    up: migration_20260507_221522_initial.up,
    down: migration_20260507_221522_initial.down,
    name: '20260507_221522_initial',
  },
]
