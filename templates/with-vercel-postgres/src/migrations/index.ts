import * as migration_20250516_145207_initial from './20250516_145207_initial'

export const migrations = [
  {
    up: migration_20250516_145207_initial.up,
    down: migration_20250516_145207_initial.down,
    name: '20250516_145207_initial',
  },
]
