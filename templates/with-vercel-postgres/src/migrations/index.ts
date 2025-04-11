import * as migration_20250411_172945_initial from './20250411_172945_initial'

export const migrations = [
  {
    up: migration_20250411_172945_initial.up,
    down: migration_20250411_172945_initial.down,
    name: '20250411_172945_initial',
  },
]
