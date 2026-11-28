import * as migration_20261124_170232_initial from './20261124_170232_initial'

export const migrations = [
  {
    up: migration_20261124_170232_initial.up,
    down: migration_20261124_170232_initial.down,
    name: '20261124_170232_initial',
  },
]
