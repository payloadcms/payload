import * as migration_20250522_150852_initial from './20250522_150852_initial'

export const migrations = [
  {
    up: migration_20250522_150852_initial.up,
    down: migration_20250522_150852_initial.down,
    name: '20250522_150852_initial',
  },
]
