import * as migration_20261117_180933_initial from './20261117_180933_initial'

export const migrations = [
  {
    up: migration_20261117_180933_initial.up,
    down: migration_20261117_180933_initial.down,
    name: '20261117_180933_initial',
  },
]
