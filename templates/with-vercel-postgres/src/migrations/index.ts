import * as migration_20261117_180910_initial from './20261117_180910_initial'

export const migrations = [
  {
    up: migration_20261117_180910_initial.up,
    down: migration_20261117_180910_initial.down,
    name: '20261117_180910_initial',
  },
]
