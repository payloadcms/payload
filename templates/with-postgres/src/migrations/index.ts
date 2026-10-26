import * as migration_20261022_163827_initial from './20261022_163827_initial'

export const migrations = [
  {
    up: migration_20261022_163827_initial.up,
    down: migration_20261022_163827_initial.down,
    name: '20261022_163827_initial',
  },
]
