import * as migration_20261110_212741_initial from './20261110_212741_initial'

export const migrations = [
  {
    up: migration_20261110_212741_initial.up,
    down: migration_20261110_212741_initial.down,
    name: '20261110_212741_initial',
  },
]
