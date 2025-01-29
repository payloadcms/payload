import * as migration_20250129_155105_initial from './20250129_155105_initial'

export const migrations = [
  {
    up: migration_20250129_155105_initial.up,
    down: migration_20250129_155105_initial.down,
    name: '20250129_155105_initial',
  },
]
