import * as migration_20261027_154718_initial from './20261027_154718_initial'

export const migrations = [
  {
    up: migration_20261027_154718_initial.up,
    down: migration_20261027_154718_initial.down,
    name: '20261027_154718_initial',
  },
]
