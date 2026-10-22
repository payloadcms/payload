import * as migration_20261022_185432_initial from './20261022_185432_initial'

export const migrations = [
  {
    up: migration_20261022_185432_initial.up,
    down: migration_20261022_185432_initial.down,
    name: '20261022_185432_initial',
  },
]
