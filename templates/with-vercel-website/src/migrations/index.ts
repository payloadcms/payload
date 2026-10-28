import * as migration_20261022_185417_initial from './20261022_185417_initial'

export const migrations = [
  {
    up: migration_20261022_185417_initial.up,
    down: migration_20261022_185417_initial.down,
    name: '20261022_185417_initial',
  },
]
