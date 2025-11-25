import * as migration_20251113_194404_initial from './20251113_194404_initial'

export const migrations = [
  {
    up: migration_20251113_194404_initial.up,
    down: migration_20251113_194404_initial.down,
    name: '20251113_194404_initial',
  },
]
