import * as migration_20241203_192242_initial from './20241203_192242_initial'

export const migrations = [
  {
    up: migration_20241203_192242_initial.up,
    down: migration_20241203_192242_initial.down,
    name: '20241203_192242_initial',
  },
]
