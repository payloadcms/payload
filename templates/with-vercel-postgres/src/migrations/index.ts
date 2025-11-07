import * as migration_20251107_152345_initial from './20251107_152345_initial'

export const migrations = [
  {
    up: migration_20251107_152345_initial.up,
    down: migration_20251107_152345_initial.down,
    name: '20251107_152345_initial',
  },
]
