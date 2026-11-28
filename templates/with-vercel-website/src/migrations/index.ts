import * as migration_20261124_170216_initial from './20261124_170216_initial'

export const migrations = [
  {
    up: migration_20261124_170216_initial.up,
    down: migration_20261124_170216_initial.down,
    name: '20261124_170216_initial',
  },
]
