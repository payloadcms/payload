import * as migration_20261120_153557_initial from './20261120_153557_initial'

export const migrations = [
  {
    up: migration_20261120_153557_initial.up,
    down: migration_20261120_153557_initial.down,
    name: '20261120_153557_initial',
  },
]
