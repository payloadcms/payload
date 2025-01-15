import * as migration_20250115_191412_initial from './20250115_191412_initial'

export const migrations = [
  {
    up: migration_20250115_191412_initial.up,
    down: migration_20250115_191412_initial.down,
    name: '20250115_191412_initial',
  },
]
