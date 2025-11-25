import * as migration_20251113_194425_initial from './20251113_194425_initial'

export const migrations = [
  {
    up: migration_20251113_194425_initial.up,
    down: migration_20251113_194425_initial.down,
    name: '20251113_194425_initial',
  },
]
