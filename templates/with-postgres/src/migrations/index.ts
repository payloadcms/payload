import * as migration_20261124_171608_initial from './20261124_171608_initial'

export const migrations = [
  {
    up: migration_20261124_171608_initial.up,
    down: migration_20261124_171608_initial.down,
    name: '20261124_171608_initial',
  },
]
