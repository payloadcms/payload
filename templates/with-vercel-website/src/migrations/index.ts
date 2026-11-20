import * as migration_20261120_153854_initial from './20261120_153854_initial'

export const migrations = [
  {
    up: migration_20261120_153854_initial.up,
    down: migration_20261120_153854_initial.down,
    name: '20261120_153854_initial',
  },
]
