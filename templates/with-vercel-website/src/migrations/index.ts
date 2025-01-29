import * as migration_20250129_032924_initial from './20250129_032924_initial'

export const migrations = [
  {
    up: migration_20250129_032924_initial.up,
    down: migration_20250129_032924_initial.down,
    name: '20250129_032924_initial',
  },
]
