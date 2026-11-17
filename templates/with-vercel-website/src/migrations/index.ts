import * as migration_20261117_182432_initial from './20261117_182432_initial'

export const migrations = [
  {
    up: migration_20261117_182432_initial.up,
    down: migration_20261117_182432_initial.down,
    name: '20261117_182432_initial',
  },
]
