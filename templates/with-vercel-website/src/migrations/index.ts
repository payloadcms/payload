import * as migration_20250115_191426_initial from './20250115_191426_initial'

export const migrations = [
  {
    up: migration_20250115_191426_initial.up,
    down: migration_20250115_191426_initial.down,
    name: '20250115_191426_initial',
  },
]
