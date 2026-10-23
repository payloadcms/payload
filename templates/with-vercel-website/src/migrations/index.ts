import * as migration_20261022_163814_initial from './20261022_163814_initial'

export const migrations = [
  {
    up: migration_20261022_163814_initial.up,
    down: migration_20261022_163814_initial.down,
    name: '20261022_163814_initial',
  },
]
