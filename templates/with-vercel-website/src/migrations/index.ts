import * as migration_20250726_113914_initial from './20250726_113914_initial'

export const migrations = [
  {
    up: migration_20250726_113914_initial.up,
    down: migration_20250726_113914_initial.down,
    name: '20250726_113914_initial',
  },
]
