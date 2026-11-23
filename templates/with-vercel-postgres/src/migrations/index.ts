import * as migration_20261120_153515_initial from './20261120_153515_initial'

export const migrations = [
  {
    up: migration_20261120_153515_initial.up,
    down: migration_20261120_153515_initial.down,
    name: '20261120_153515_initial',
  },
]
