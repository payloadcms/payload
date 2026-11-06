import * as migration_20261104_152232_initial from './20261104_152232_initial'

export const migrations = [
  {
    up: migration_20261104_152232_initial.up,
    down: migration_20261104_152232_initial.down,
    name: '20261104_152232_initial',
  },
]
