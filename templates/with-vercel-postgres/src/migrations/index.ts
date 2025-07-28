import * as migration_20250726_113907_initial from './20250726_113907_initial'

export const migrations = [
  {
    up: migration_20250726_113907_initial.up,
    down: migration_20250726_113907_initial.down,
    name: '20250726_113907_initial',
  },
]
