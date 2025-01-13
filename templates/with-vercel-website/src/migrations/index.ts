import * as migration_20250113_213313_initial from './20250113_213313_initial'

export const migrations = [
  {
    up: migration_20250113_213313_initial.up,
    down: migration_20250113_213313_initial.down,
    name: '20250113_213313_initial',
  },
]
