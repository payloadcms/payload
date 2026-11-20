import * as migration_20261120_153835_initial from './20261120_153835_initial'

export const migrations = [
  {
    up: migration_20261120_153835_initial.up,
    down: migration_20261120_153835_initial.down,
    name: '20261120_153835_initial',
  },
]
