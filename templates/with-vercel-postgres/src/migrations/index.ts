import * as migration_20261124_171525_initial from './20261124_171525_initial'

export const migrations = [
  {
    up: migration_20261124_171525_initial.up,
    down: migration_20261124_171525_initial.down,
    name: '20261124_171525_initial',
  },
]
