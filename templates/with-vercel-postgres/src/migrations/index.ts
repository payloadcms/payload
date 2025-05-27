import * as migration_20250522_154829_initial from './20250522_154829_initial'

export const migrations = [
  {
    up: migration_20250522_154829_initial.up,
    down: migration_20250522_154829_initial.down,
    name: '20250522_154829_initial',
  },
]
