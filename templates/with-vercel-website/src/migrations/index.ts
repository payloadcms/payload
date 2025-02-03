import * as migration_20250129_033102_initial from './20250129_033102_initial'

export const migrations = [
  {
    up: migration_20250129_033102_initial.up,
    down: migration_20250129_033102_initial.down,
    name: '20250129_033102_initial',
  },
]
