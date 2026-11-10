import * as migration_20261110_212755_initial from './20261110_212755_initial'

export const migrations = [
  {
    up: migration_20261110_212755_initial.up,
    down: migration_20261110_212755_initial.down,
    name: '20261110_212755_initial',
  },
]
