import * as migration_20241221_080802_initial from './20241221_080802_initial'

export const migrations = [
  {
    up: migration_20241221_080802_initial.up,
    down: migration_20241221_080802_initial.down,
    name: '20241221_080802_initial',
  },
]
