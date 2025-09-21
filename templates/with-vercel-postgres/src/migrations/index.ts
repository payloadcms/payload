import * as migration_20250910_185118_initial from './20250910_185118_initial'

export const migrations = [
  {
    up: migration_20250910_185118_initial.up,
    down: migration_20250910_185118_initial.down,
    name: '20250910_185118_initial',
  },
]
