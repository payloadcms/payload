import * as migration_20250726_113920_initial from './20250726_113920_initial'

export const migrations = [
  {
    up: migration_20250726_113920_initial.up,
    down: migration_20250726_113920_initial.down,
    name: '20250726_113920_initial',
  },
]
