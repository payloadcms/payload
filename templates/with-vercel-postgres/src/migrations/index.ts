import * as migration_20250129_033058_initial from './20250129_033058_initial'

export const migrations = [
  {
    up: migration_20250129_033058_initial.up,
    down: migration_20250129_033058_initial.down,
    name: '20250129_033058_initial',
  },
]
