import * as migration_20250113_213324_initial from './20250113_213324_initial'

export const migrations = [
  {
    up: migration_20250113_213324_initial.up,
    down: migration_20250113_213324_initial.down,
    name: '20250113_213324_initial',
  },
]
