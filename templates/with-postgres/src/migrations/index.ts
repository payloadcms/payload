import * as migration_20250108_025804_initial from './20250108_025804_initial'

export const migrations = [
  {
    up: migration_20250108_025804_initial.up,
    down: migration_20250108_025804_initial.down,
    name: '20250108_025804_initial',
  },
]
