import * as migration_20250303_013917_initial from './20250303_013917_initial'

export const migrations = [
  {
    up: migration_20250303_013917_initial.up,
    down: migration_20250303_013917_initial.down,
    name: '20250303_013917_initial',
  },
]
