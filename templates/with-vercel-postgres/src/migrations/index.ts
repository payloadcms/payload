import * as migration_20261104_152147_initial from './20261104_152147_initial'

export const migrations = [
  {
    up: migration_20261104_152147_initial.up,
    down: migration_20261104_152147_initial.down,
    name: '20261104_152147_initial',
  },
]
