import * as migration_20261124_170157_initial from './20261124_170157_initial'

export const migrations = [
  {
    up: migration_20261124_170157_initial.up,
    down: migration_20261124_170157_initial.down,
    name: '20261124_170157_initial',
  },
]
