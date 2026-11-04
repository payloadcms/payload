import * as migration_20261104_152935_initial from './20261104_152935_initial'

export const migrations = [
  {
    up: migration_20261104_152935_initial.up,
    down: migration_20261104_152935_initial.down,
    name: '20261104_152935_initial',
  },
]
