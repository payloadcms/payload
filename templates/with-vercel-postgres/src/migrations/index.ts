import * as migration_20250909_160945_initial from './20250909_160945_initial'

export const migrations = [
  {
    up: migration_20250909_160945_initial.up,
    down: migration_20250909_160945_initial.down,
    name: '20250909_160945_initial',
  },
]
