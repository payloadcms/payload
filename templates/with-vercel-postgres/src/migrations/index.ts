import * as migration_20261110_212723_initial from './20261110_212723_initial'

export const migrations = [
  {
    up: migration_20261110_212723_initial.up,
    down: migration_20261110_212723_initial.down,
    name: '20261110_212723_initial',
  },
]
