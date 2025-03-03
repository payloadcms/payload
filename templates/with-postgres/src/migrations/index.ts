import * as migration_20250303_013923_initial from './20250303_013923_initial'

export const migrations = [
  {
    up: migration_20250303_013923_initial.up,
    down: migration_20250303_013923_initial.down,
    name: '20250303_013923_initial',
  },
]
