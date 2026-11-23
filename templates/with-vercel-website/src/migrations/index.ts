import * as migration_20261120_153537_initial from './20261120_153537_initial'

export const migrations = [
  {
    up: migration_20261120_153537_initial.up,
    down: migration_20261120_153537_initial.down,
    name: '20261120_153537_initial',
  },
]
