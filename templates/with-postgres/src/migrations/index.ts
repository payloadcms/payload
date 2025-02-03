import * as migration_20250129_033106_initial from './20250129_033106_initial'

export const migrations = [
  {
    up: migration_20250129_033106_initial.up,
    down: migration_20250129_033106_initial.down,
    name: '20250129_033106_initial',
  },
]
