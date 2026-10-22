import * as migration_20261022_185400_initial from './20261022_185400_initial'

export const migrations = [
  {
    up: migration_20261022_185400_initial.up,
    down: migration_20261022_185400_initial.down,
    name: '20261022_185400_initial',
  },
]
